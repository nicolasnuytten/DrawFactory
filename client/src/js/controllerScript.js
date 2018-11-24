import '../css/style.css';
import io from 'socket.io-client';

let socket, targetId;
let lastControllerX, lastControllerY;
let fingerPos = {x:0, y:0};
let lastFingerPos = fingerPos;
let drawing = false;

const ctx = document.querySelector('#canvas').getContext('2d');

const handelMouseMove = (x,y) => {
  console.log(x,y);
  draw(x,y);
}

const draw = (x,y) => {
  fingerPos =  {x, y}
  ctx.beginPath();
  ctx.strokeStyle = `black`;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.moveTo(x, y);
  ctx.lineTo(lastFingerPos.x, lastFingerPos.y);
  ctx.closePath();
  ctx.stroke();

  lastFingerPos = {x, y}; 
}


// socket.emit(`update`, targetId, {
//   x: e.touches[0].clientX / window.innerWidth,
//   y: e.touches[0].clientY / window.innerHeight
// });

const init = () => {
  lastControllerX = 0;
  lastControllerY = 0;
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height= window.innerHeight;
  console.log('hello mobile');
  targetId = getUrlParameter(`id`);
  if (!targetId) {
    alert(`Missing target ID in querystring`);
    return;
  }
  connect();

  window.addEventListener(`touchstart`, e => {
    drawing = true;
    lastFingerPos = {x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY} 
  });
  window.addEventListener(`touchend`, e => {
    drawing = false;
  });
  window.addEventListener(`touchmove`, e => {
    draw(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
  });    
  
};

const connect = () => {
  // Met IP voor op mobile te testen!!!!!
  socket = io.connect('http://192.168.0.31.:8085');
  // socket = io.connect('http://localhost:8085');
  socket.on(`connectionUrl`, connectionUrl => {
    //   createQRCode();  
    console.log(`${socket.id}`);
    socket.emit(`connectiontest`, targetId, socket.id);
  });

  socket.on(`connectiontest2`, data => {
    console.log(`komt ook terug aan:  ${data}`);
  });

  socket.on(`update`, data => {
    console.log(`data from socket: ${data}`);
  });
};

const getUrlParameter = name => {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

init();
