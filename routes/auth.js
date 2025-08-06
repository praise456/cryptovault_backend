// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Simple helper for validation (no external deps required)
function validateRegisterInput(email, password) {
  if (!email || !password) return 'Email and password are required';
  if (typeof password !== 'string' || password.length < 6) return 'Password must be at least 6 characters';
  // optional: crude email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please provide a valid email';
  return null;
}

function validateLoginInput(email, password) {
  if (!email || !password) return 'Email and password are required';
  return null;
}

/**
 * POST /api/register
 * Expected body: { email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const validationError = validateRegisterInput(email, password);
    if (validationError) return res.status(422).json({ msg: validationError });

    // normalize email
    const normalizedEmail = email.toLowerCase().trim();

    let existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ email: normalizedEmail, password: hashed });
    await user.save();

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set in environment');
      return res.status(500).json({ msg: 'Server configuration error' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // return created user info (no password)
    return res.status(201).json({ token, user: { id: user._id, email: user.email, balance: user.balance || 0 } });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * POST /api/login
 * Expected body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const validationError = validateLoginInput(email, password);
    if (validationError) return res.status(422).json({ msg: validationError });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set in environment');
      return res.status(500).json({ msg: 'Server configuration error' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({ token, user: { id: user._id, email: user.email, balance: user.balance || 0 } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
module.exports = router;
