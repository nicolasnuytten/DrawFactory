import '../css/controller.css';
import io from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';
import 'fabric';

let socket, targetId;
let coords = [];
let model;
const classNames = []; 
let canvas;
let firstCorrectDrawing = false;
let mousePressed = false;
// let numChannels;
let selectedGift;

const informationText = document.querySelector('.information-text');
const popUp = document.querySelector('.correct');

const init = () => {
  console.log('hello mobile');
  targetId = getUrlParameter(`id`);
  if (!targetId) {
    alert(`Missing target ID in querystring`);
    return;
  }
  connect();

  setupCanvas();
  
  document.querySelector(`.button__clear`).addEventListener(`click`, refreshCanvas);
  document.querySelector(`.button__skip`).addEventListener(`click`, requestNewWish);

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
  
  canvas = new fabric.Canvas('canvas'); // eslint-disable-line
  canvas.backgroundColor = '#ffffff';
  canvas.isDrawingMode = 0;
  canvas.freeDrawingBrush.color = 'black';
  canvas.freeDrawingBrush.width = 15;
  canvas.renderAll();
  //setup listeners
  canvas.on('mouse:up', () => {
    getFrame();
    mousePressed = false;
  });
  canvas.on('mouse:down', () => {
    mousePressed = true;
  });
  canvas.on('mouse:move', e => {
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

const requestNewWish = () => {
  refreshCanvas();
  socket.emit(`skip`, targetId, `new drawing`);
};

const loadModel = async () => {
  model = await tf.loadModel('model2/model.json');

  model.predict(tf.zeros([1, 28, 28, 1]));

  await loadDict();
};

const loadDict = async () => {
  const loc = 'model2/class_names.txt';
  
  fetch(loc)
    .then(res => res.text()) // parse response as JSON (can be res.text() for plain response)
    .then(response => {
      success(response);
    })
    .catch(err => {
      console.log(err);
      alert('sorry, there are no results for your search');
    });

  console.log('ready to go');
};

const getFrame = () => {
  if (coords.length >= 2) {
    const imgData = getImageData();
    const pred = model.predict(preprocess(imgData)).dataSync();
    const indices = findIndicesOfMax(pred, 7);
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
  const minCoords = {
    x: Math.min.apply(null, coorX),
    y: Math.min.apply(null, coorY)
  };
  const maxCoords = {
    x: Math.max.apply(null, coorX),
    y: Math.max.apply(null, coorY)
  };

  //return as struct 
  return {
    min: minCoords,
    max: maxCoords
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

// const findTopValues = (inp, count) => {
//   const output = [];
//   const indices = findIndicesOfMax(inp, count);
//   // show 5 greatest scores
//   for (let i = 0;i < indices.length;i ++)
//     output[i] = inp[indices[i]];
//   return output;
// };

const getClassNames = indices => {
  const output = [];
  for (let i = 0;i < indices.length;i ++)
    output[i] = classNames[indices[i]];
  return output;
};

const preprocess = imgData => {
  return tf.tidy(() => {
    //convert to a tensor 
    const tensor = tf.fromPixels(imgData, 1);
      
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
  // socket = io.connect('https://io-server-nfmgfiicut.now.sh');
  // socket = io.connect('https://io-server-gpyaypsyzu.now.sh');
  
  
  socket = io.connect('https://io-server-msgsftozvj.now.sh');
  // socket = io.connect('http://localhost:8085');
  socket.on(`connectionUrl`, () => {
    //   createQRCode();  
    console.log(`this is the socket id ${socket.id}`);
    socket.emit(`controllerConnected`, targetId, socket.id);
  });

  socket.on(`clientConnected`, () => {
    console.log(`client is connected`);
  });

  socket.on(`giftToDraw`, data => {
    refreshCanvas();
    setGiftToDraw(data);
  });

  socket.on(`correctDrawing`, () => {
    console.log(`drawing is correct`);
    firstCorrectDrawing = true;
    canvas.isDrawingMode = 0;
    popUp.style.display = 'flex';
    informationText.textContent = ``;
    const audio = new Audio('assets/audio/correct.mp3');
    audio.loop = false;
    audio.play();
    refreshCanvas();
    setTimeout(() => {
      canvas.isDrawingMode = 1;
      informationText.textContent = `draw a: ${selectedGift}`;
      popUp.style.display = 'none';
    }, 2000);
  });
};

const getUrlParameter = name => {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]'); // eslint-disable-line
  const regex = new RegExp(`[\\?&]${  name  }=([^&#]*)`);
  const results = regex.exec(location.search);
  return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const setGiftToDraw = giftToDraw => {
  selectedGift = giftToDraw;
  if (firstCorrectDrawing === false) {
    canvas.isDrawingMode = 1;
  }
  informationText.textContent = `draw a: ${giftToDraw}`;
};

init();
