require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();

/* ---------- CORS ---------- */
// Allow all origins for now (development)
app.use(cors());

// In production, restrict to your frontend domain:
// app.use(cors({ origin: 'https://your-frontend-domain.com' }));

/* ---------- Middleware ---------- */
app.use(express.json()); // parse JSON before routes

/* ---------- MongoDB Connection ---------- */
const uri = process.env.MONGO_URI || "mongodb+srv://admin:Stellar43@cluster0.xly04mf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/* ---------- Routes ---------- */
// Auth routes for /api/register and /api/login
app.use('/api', authRoutes);

// Protected GET /user
app.get('/user', async (req, res) => {
  const token = req.header('x-auth-token') || (req.header('authorization') || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
});

// Protected POST /user/invest
app.post('/user/invest', async (req, res) => {
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

    user.investments.push({ plan, amount, roi: 0 });
    await user.save();

    res.json({ msg: 'Investment recorded', user });
  } catch (err) {
    console.error('Investment error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ---------- Global Error Handler ---------- */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal server error' });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
