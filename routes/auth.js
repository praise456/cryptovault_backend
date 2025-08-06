// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const router = express.Router();

// rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { msg: 'Too many requests, please try again later.' },
});

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array().map(e => e.msg) });
  }
  return null;
};

// POST /api/register
router.post(
  '/register',
  limiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    const { email, password } = req.body || {};

    try {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) return res.status(409).json({ msg: 'User already exists' });

      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(password, salt);

      const user = new User({ email: email.toLowerCase().trim(), password: hashed });
      await user.save();

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET missing');
        return res.status(500).json({ msg: 'Server configuration error' });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({ token, user: { id: user._id, email: user.email, balance: user.balance || 0 } });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// POST /api/login
router.post(
  '/login',
  limiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    const { email, password } = req.body || {};

    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ msg: 'Invalid credentials' });

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET missing');
        return res.status(500).json({ msg: 'Server configuration error' });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, user: { id: user._id, email: user.email, balance: user.balance || 0 } });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
