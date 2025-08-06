const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify token
function auth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
}

// Get user dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Post new investment
router.post('/invest', auth, async (req, res) => {
  const { plan, amount } = req.body;
  const roiMap = { Starter: 0.05, Pro: 0.07, Elite: 0.10 };

  try {
    const user = await User.findById(req.user.id);
    const roi = amount * (roiMap[plan] || 0);
    const investment = {
      plan,
      amount,
      roi,
      createdAt: new Date()
    };
    user.investments.push(investment);
    user.balance += roi;
    await user.save();

    res.json({ msg: 'Investment successful', investment });
  } catch (e) {
    res.status(500).json({ msg: 'Investment failed' });
  }
});

module.exports = router;