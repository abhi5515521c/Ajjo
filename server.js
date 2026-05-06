const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Simple in-memory storage for room state
const roomStates = {
  'ajjjo-abhijeet-jenny': {
    note: "",
    watchlist: "",
    cravings: "",
    money: 0
  }
};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join-room', (roomCode) => {
    socket.join(roomCode);
    socket.roomCode = roomCode;
    console.log(`User ${socket.id} joined room: ${roomCode}`);
    
    // Send the current state of the room to the newly joined user
    if (roomStates[roomCode]) {
      socket.emit('init-state', roomStates[roomCode]);
    }
    
    socket.to(roomCode).emit('action', { type: 'PARTNER_ONLINE' });
  });

  socket.on('action', (data) => {
    if (socket.roomCode) {
      // Persist certain actions
      if (data.type === 'NOTE_UPDATE') {
        roomStates[socket.roomCode].note = data.payload.text;
      }
      if (data.type === 'WATCHLIST_UPDATE') {
        roomStates[socket.roomCode].watchlist = data.payload.html;
      }
      if (data.type === 'MONEY_UPDATE') {
        roomStates[socket.roomCode].money = data.payload.amount;
      }
      if (data.type === 'CRAVINGS_UPDATE') {
        roomStates[socket.roomCode].cravings = data.payload.html;
      }

      
      socket.to(socket.roomCode).emit('action', data);
    }
  });

  socket.on('disconnect', () => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit('action', {
        type: 'PARTNER_OFFLINE'
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`AJJJO Server running on port ${PORT}`);
});
