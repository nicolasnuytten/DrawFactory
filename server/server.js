const express = require('express');
const app = express();
const server = require('http').Server(app);
const port = process.env.PORT || 8085;

const io = require('socket.io')(server);
let connectionUrl = '';

const users = {};

io.on('connection', socket => {
  console.log('connection');
  socket.emit('connectionUrl', connectionUrl);

  users[socket.id] = {
    id: socket.id
  };

  socket.on(`message`, message => {
    console.log(`received message: ${message}`);
    io.sockets.emit(`message`, message);
  });

  socket.on('update', (targetId, data) => {
    console.log(`In de update ${targetId}`);
    if (!users[targetId]) {
      return;
    }
    socket.to(targetId).emit('update', data);
  });


  socket.on('controllerConnected', (targetId, data) => {
    console.log(`id controller ${data}`);
    if (!users[targetId]) {
      return;
    }
    socket.to(targetId).emit('controllerConnected', data);
  });

  socket.on('clientConnected', (controllerId, data) => {
    console.log(`de id van de controller ${controllerId}`);
    if (!users[controllerId]) {
      return;
    }
    socket.to(controllerId).emit('clientConnected', data);
  });

  socket.on('giftToDraw', (controllerId, data) => {
    if (!users[controllerId]) {
      return;
    }
    socket.to(controllerId).emit('giftToDraw', data);
  });

  socket.on('skip', (clientId, data) => {
    if (!users[clientId]) {
      return;
    }
    socket.to(clientId).emit('skip', data);
  });

  socket.on('correctDrawing', (controllerId, data) => {
    if (!users[controllerId]) {
      return;
    }
    socket.to(controllerId).emit('correctDrawing', data);
  });

  socket.on('prediction', (clientId, data) => {
    console.log(`de id van de controller ${data}`);
    if (!users[clientId]) {
      return;
    }
    socket.to(clientId).emit('prediction', data);
  });

  socket.on('move', (targetId, data) => {
    if (!users[targetId]) {
      return;
    }
    console.log(`In de move ${targetId}`);
    socket.to(targetId).emit('move', data);
  });


  socket.on(`drawingCorrect`, (targetId, data) => {
    if (!users[targetId]) {
      return;
    }
    socket.to(targetId).emit(`drawingCorrect`, data);
  })

  socket.on('reply', (targetId, data) => {
    if (!users[targetId]) {
      return;
    }
    console.log(`In de reply ${targetId}`);
    socket.to(targetId).emit('reply', data);
  });

  socket.on('disconnect', () => {
    console.log('client disconnected');
    delete users[socket.id];
  });
});

server.listen(port, () => {
  console.log(`App listening on port ${port}!`);

  // require('./get-ip-addresses')().then(ipAddresses => {
  //   if (ipAddresses.en0) {
  //     connectionUrl = `http://${ipAddresses.en0[0]}:8080`;
  //   } else {
  //     connectionUrl = `http://localhost:${port}`;
  //   }
  // });
});

