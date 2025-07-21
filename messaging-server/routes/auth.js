// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const users = require('../users'); // import our in-memory user store
const jwt = require('jsonwebtoken'); // Add this to top of file if not already present
const JWT_SECRET = 'mySuperSecret123'; // In production, use env variable!

const router = express.Router();

// Registration Endpoint
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Simple validation
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  if (users[username])
    return res.status(409).json({ error: 'User already exists' });

  // Hash the password
  const hashed = await bcrypt.hash(password, 10);

  // Store new user (unverified initially)
  users[username] = { password: hashed, verified: false };

  res.json({ message: 'Registered! Please verify with OTP.' });
});

module.exports = router;

// OTP Verification Endpoint
router.post('/verify', (req, res) => {
  const { username, otp } = req.body;

  // Basic checks
  if (!username || !otp)
    return res.status(400).json({ error: 'Username and otp required' });

  if (!users[username])
    return res.status(404).json({ error: 'User not found' });

  if (otp !== '123456')
    return res.status(401).json({ error: 'Incorrect OTP' });

  // Mark user as verified
  users[username].verified = true;

  res.json({ message: 'User is verified! You may now log in.' });
});



// Login Endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check inputs
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const user = users[username];
  if (!user)
    return res.status(404).json({ error: 'User not found' });

  if (!user.verified)
    return res.status(403).json({ error: 'User not verified' });

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(401).json({ error: 'Invalid credentials' });

  // Sign and return JWT
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});
