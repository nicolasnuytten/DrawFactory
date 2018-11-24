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
    // if the target user does not exist, ignore it
    if (!users[targetId]) {
      return;
    }
    // send an update to that particular socket
    socket.to(targetId).emit('update', data);


  });

  socket.on('connectiontest', (targetId, data) => {
    console.log(`In de connect ${targetId}`);
    // if the target user does not exist, ignore it
    if (!users[targetId]) {
      console.log(`het zit hier`);
      return;
    }
    // send an update to that particular socket
    socket.to(targetId).emit('connectiontest', data);


  });

  socket.on('connectiontest2', (targetId, data) => {
    console.log(`In de connect2222 ${targetId}`);
    // if the target user does not exist, ignore it
    if (!users[targetId]) {
      console.log(`het zit hier`);
      return;
    }
    // send an update to that particular socket
    socket.to(targetId).emit('connectiontest2', data);


  });

  socket.on('move', (targetId, data) => {
    // if the target user does not exist, ignore it
    if (!users[targetId]) {
      return;
    }
    // send an update to that particular socket
    console.log(`In de move ${targetId}`);
    socket.to(targetId).emit('move', data);
  });

  socket.on('reply', (targetId, data) => {
    // if the target user does not exist, ignore it
    if (!users[targetId]) {
      return;
    }
    // send an update to that particular socket
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

  require('./get-ip-addresses')().then(ipAddresses => {
    if (ipAddresses.en0) {
      connectionUrl = `http://${ipAddresses.en0[0]}:${port}`;
    } else {
      connectionUrl = `http://localhost:${port}`;
    }
  });
});

