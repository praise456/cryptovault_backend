const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const app = express();
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
      balance: user.balance || 0,
      investments: user.investments || [],
      transactions: user.transactions || []
    });
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
});


// Post new investment
app.post('/api/user/invest', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { plan, amount } = req.body;

    if (!plan || typeof amount !== 'number') {
      return res.status(400).json({ msg: 'Plan and amount are required' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.investments.push({
      plan,
      amount,
      roi: 0,
      date: new Date()
    });

    await user.save();

    res.json({ msg: 'Investment recorded', user });
  } catch (err) {
    console.error('Investment error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
