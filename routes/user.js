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
// GET /user
app.get('/user', async (req, res) => {
  const token = req.header('x-auth-token') || (req.header('authorization') || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json({
      id: user._id,
      name: user.name,           // ✅ Make sure name is included
      email: user.email,
      balance: user.balance || 0
    });
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
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
