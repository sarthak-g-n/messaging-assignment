//for initial testing
const { io } = require('socket.io-client');
const readline = require('readline');

// === Change these to test with alice or bob, and point to the other as receiver ===
const USERNAME = 'neelu'; 
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im5lZWx1IiwiaWF0IjoxNzUzMDA3Nzc5LCJleHAiOjE3NTMwMTEzNzl9.3EddbstGNDBIZd6yTVUb_Gi31_Sy4c0R6fvtEqjcO6Q'; // Paste from REST /login for this user
const RECEIVER = 'sarthak';

// Connect socket with JWT
const socket = io('http://localhost:3000', {
  auth: { token: TOKEN }
});

socket.on('connect', () => {
  console.log(`Connected as ${USERNAME}`);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

socket.on('message', (msg) => {
  console.log('>> Received message:', msg);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

// Message prompt for input
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function promptAndSend() {
  rl.question('Type message (or "exit"): ', (text) => {
    if (text === 'exit') {
      socket.disconnect();
      rl.close();
      return;
    }
    socket.emit('message', {
      receiver: RECEIVER,
      text,
      timestamp: new Date().toISOString(),
    });
    promptAndSend();
  });
}

socket.on('connect', promptAndSend);
