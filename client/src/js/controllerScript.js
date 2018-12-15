import '../css/controller.css';
import io from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';
import 'fabric';

let socket, targetId;
let coords = [];
let model;
const classNames = []; 
let canvas;
let mousePressed = false;
let modelLoaded = false;
let numChannels;

const informationText = document.querySelector('.information-text');

const init = () => {
  console.log('hello mobile');
  targetId = getUrlParameter(`id`);
  if (!targetId) {
    alert(`Missing target ID in querystring`);
    return;
  }
  connect();

  setupCanvas();
  
  document.querySelector(`.refresh-button`).addEventListener(`click`, refreshCanvas);

  loadModel();
};

const setupCanvas = () => {
  const canvasSelection = document.getElementById('canvas');
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (window.innerHeight >= window.innerWidth) {
    canvasSelection.width = Math.round(viewportWidth * 90 / 100);
    canvasSelection.height = Math.round(viewportWidth * 90 / 100);
  } else {
    canvasSelection.width = Math.round(viewportWidth * 80 / 100);
    canvasSelection.height = Math.round(viewportHeight * 50 / 100);
  }
  
  canvas = new fabric.Canvas('canvas');
  canvas.backgroundColor = '#ffffff';
  canvas.freeDrawingBrush.color = 'black';
  canvas.freeDrawingBrush.width = 15;
  canvas.renderAll();
  //setup listeners
  canvas.on('mouse:up', e => {
    getFrame();
    mousePressed = false;
    console.log(`up`);
  });
  canvas.on('mouse:down', e => {
    mousePressed = true;
    console.log(`down`);
  });
  canvas.on('mouse:move', e => {
    console.log(`beweging`);
    recordCoor(e);
  });

};

const recordCoor = e => {
  const pointer = canvas.getPointer(e.e);
  const posX = pointer.x;
  const posY = pointer.y;

  if (posX >= 0 && posY >= 0 && mousePressed) {
    coords.push(pointer);
  }
};

const refreshCanvas = () => {
  coords = [];
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
};

const loadModel = async () => {
  model = await tf.loadModel('src/model2/model.json');

  model.predict(tf.zeros([1, 28, 28, 1]));

  await loadDict();
};

const loadDict = async () => {
  const loc = 'src/model2/class_names.txt';
  
  fetch(loc)
    .then(res => res.text()) // parse response as JSON (can be res.text() for plain response)
    .then(response => {
      success(response);
    })
    .catch(err => {
      console.log('u');
      alert('sorry, there are no results for your search');
    });

  console.log('ready to go');
};

const getFrame = () => {
  if (coords.length >= 2) {
    const imgData = getImageData();

    console.log('Data', imgData);

    const pred = model.predict(preprocess(imgData)).dataSync();

    const indices = findIndicesOfMax(pred, 7);
    const probs = findTopValues(pred, 7);
    const names = getClassNames(indices);
    console.log(names);

    socket.emit(`prediction`, targetId, {
      suggestion: names
    });
    console.log(`registering drawing`);
  }
};

const success = data => {
  console.log(data);
  const lst = data.split(/\n/);
  console.log(lst);
  for (let i = 0;i < lst.length - 1;i ++) {
    const symbol = lst[i];
    classNames[i] = symbol;
  }
  modelLoaded = true;
};

const getMinBox = () => {
  //get coordinates 
  const coorX = coords.map(function(p) {
    return p.x;
  });
  const coorY = coords.map(function(p) {
    return p.y;
  });

  //find top left and bottom right corners 
  const min_coords = {
    x: Math.min.apply(null, coorX),
    y: Math.min.apply(null, coorY)
  };
  const max_coords = {
    x: Math.max.apply(null, coorX),
    y: Math.max.apply(null, coorY)
  };

  //return as struct 
  return {
    min: min_coords,
    max: max_coords
  };

};

const getImageData = () => {
  const mbb = getMinBox();
  const dpi = window.devicePixelRatio;
  const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
    (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);

  return imgData;
};

const findIndicesOfMax = (inp, count) => {
  const output = [];
  for (let i = 0;i < inp.length;i ++) {
    output.push(i); // add index to output array
    if (output.length > count) {
      output.sort(function(a, b) {
        return inp[b] - inp[a];
      }); // descending sort the output array
      output.pop(); // remove the last index (index of smallest element in output array)
    }
  }
  return output;
};

const findTopValues = (inp, count) => {
  const output = [];
  const indices = findIndicesOfMax(inp, count);
  // show 5 greatest scores
  for (let i = 0;i < indices.length;i ++)
    output[i] = inp[indices[i]];
  return output;
};

const getClassNames = indices => {
  const output = [];
  for (let i = 0;i < indices.length;i ++)
    output[i] = classNames[indices[i]];
  return output;
};

const preprocess = imgData => {
  return tf.tidy(() => {
    //convert to a tensor 
    const tensor = tf.fromPixels(imgData, numChannels = 1);
      
    //resize 
    const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat();
      
    //normalize 
    const offset = tf.scalar(255.0);
    const normalized = tf.scalar(1.0).sub(resized.div(offset));

    //We add a dimension to get a batch shape 
    const batched = normalized.expandDims(0);
    return batched;
  });
};

const connect = () => {
  // Met IP voor op mobile te testen!!!!!
  // socket = io.connect('https://io-server-nxqgfvvqpl.now.sh');
  socket = io.connect('https://io-server-nfmgfiicut.now.sh');
  
  // socket = io.connect('http://192.168.1.24.:8085');
  // socket = io.connect('http://localhost:8085');
  socket.on(`connectionUrl`, connectionUrl => {
    //   createQRCode();  
    console.log(`this is the socket id ${socket.id}`);
    socket.emit(`controllerConnected`, targetId, socket.id);
  });

  socket.on(`clientConnected`, data => {
    console.log(`client is connected`);
  });

  socket.on(`update`, data => {
    console.log(`data from socket: ${data}`);
  });

  socket.on(`giftToDraw`, data => {
    refreshCanvas();
    setGiftToDraw(data);
  });

  socket.on(`correctDrawing`, data => {
    refreshCanvas();
  });
};

const getUrlParameter = name => {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp(`[\\?&]${  name  }=([^&#]*)`);
  const results = regex.exec(location.search);
  return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const setGiftToDraw = giftToDraw => {
  console.log(giftToDraw);
  informationText.textContent = `draw a: ${giftToDraw}`;
};

init();
