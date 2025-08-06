require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');            // /api/register, /api/login
const walletRoutes = require('./routes/wallet');        // /api/wallet/...
const investRoutes = require('./routes/investments');   // /api/investments/...
const adminRoutes = require('./routes/admin');          // /api/admin/...
const User = require('./models/User');

const app = express();

/* ---------- CORS ---------- */
app.use(cors()); // dev: allow all. In prod, restrict origin.

/* ---------- Middleware ---------- */
app.use(express.json()); // parse JSON before routes

/* ---------- MongoDB Connection ---------- */
// Use env var; do NOT hard-code credentials in source
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is not set in environment variables.');
  process.exit(1);
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/* ---------- Routes (mount) ---------- */
// Mount auth at /api (so router.post('/register') => POST /api/register)
app.use('/api', authRoutes);

// Mount wallet, investments, admin under /api
app.use('/api/wallet', walletRoutes);          // endpoints like /api/wallet/deposit, /api/wallet/history
app.use('/api/investments', investRoutes);     // endpoints like /api/investments/create, /api/investments
app.use('/api', adminRoutes);                  // adminRoutes defines /admin/users, /admin/credit, /admin/status

/* ---------- Example minimal /user endpoint (protected) ---------- */
app.get('/user', async (req, res) => {
  const token = req.header('x-auth-token') || (req.header('authorization') || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    if (!process.env.JWT_SECRET) return res.status(500).json({ msg: 'JWT secret not configured' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
});

/* ---------- Global Error Handler ---------- */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal server error' });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
