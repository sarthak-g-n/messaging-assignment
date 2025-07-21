
const express = require('express');
const http = require('http');
const cors = require('cors');


const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const usersOnline = {}; // { username: socket }
const pendingMessages = require('./messages');


const JWT_SECRET = 'mySuperSecret123'; 

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use(authRoutes); 

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',          
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.error('Socket.io auth error: token missing');
    return next(new Error('Auth token missing'));
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload.username; 
    next();
  } catch (err) {
    console.error('Socket.io auth error:', err.message || err);
    next(new Error('Auth token invalid'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: user=${socket.user}`);

  usersOnline[socket.user] = socket;

  if (pendingMessages[socket.user] && pendingMessages[socket.user].length > 0) {
    pendingMessages[socket.user].forEach(msg => {
      socket.emit('message', msg);
    });
    pendingMessages[socket.user] = [];
  }

  socket.on('message', (msg) => {
    const { receiver, text, timestamp } = msg;
    const from = socket.user;

    const messageData = {
      sender: from,
      receiver,
      text,
      timestamp: timestamp || new Date().toISOString(),
    };

    if (usersOnline[receiver]) {
      usersOnline[receiver].emit('message', messageData);
    } else {
      if (!pendingMessages[receiver]) pendingMessages[receiver] = [];
      pendingMessages[receiver].push(messageData);
    }
  });

  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: user=${socket.user}`);
    delete usersOnline[socket.user];
  });
});


app.get('/', (req, res) => res.send('Server running!'));

server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});

module.exports = { app, server };
