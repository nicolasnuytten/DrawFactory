import '../css/style.css';
import io from 'socket.io-client';


let socket, targetId;

const init = () => {
  console.log('hello mobile');
  targetId = getUrlParameter(`id`);
  if (!targetId) {
    alert(`Missing target ID in querystring`);
    return;
  }
  connect();
  window.addEventListener(`mousemove`, e => {
    socket.emit(`update`, targetId, {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight
    });
});
  window.addEventListener(`touchmove`, e => {
    socket.emit(`update`, targetId, {
      x: e.touches[0].clientX / window.innerWidth,
      y: e.touches[0].clientY / window.innerHeight
    });
  });
};

const connect = () => {
  // Met IP voor op mobile te testen!!!!!
  // socket = io.connect('http://172.20.64.61.:8085');
  socket = io.connect('http://localhost:8085');
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
