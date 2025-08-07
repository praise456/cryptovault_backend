// server.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('./models/User'); // <-- ADD THI
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRoutes = require('./routes/user');
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/user', userRoutes);

// ---------- Config checks ----------
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
if (!MONGO_URI) {
  console.error('MONGO_URI not set. Set it in environment variables.');
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error('JWT_SECRET not set. Set it in environment variables.');
  process.exit(1);
}

// ---------- MongoDB ----------
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ---------- Schemas & Model ----------





// ---------- Helpers ----------
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ---------- Auth middleware ----------
function authMiddleware(req, res, next) {
  const token = req.header('x-auth-token') || (req.header('authorization') || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
}

// ---------- Routes ----------
// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(422).json({ msg: 'Email and password required' });
    if (!isValidEmail(email)) return res.status(422).json({ msg: 'Invalid email' });
    if (typeof password !== 'string' || password.length < 6) return res.status(422).json({ msg: 'Password must be at least 6 chars' });

    const normalized = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(409).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ email: normalized, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, balance: user.balance } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(422).json({ msg: 'Email and password required' });
    if (!isValidEmail(email)) return res.status(422).json({ msg: 'Invalid email' });

    const normalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalized });
    if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return res.status(401).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, email: user.email, balance: user.balance } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Protected current user
app.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('/user error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------- Wallet: deposit & history ----------
app.post('/api/wallet/deposit', authMiddleware, async (req, res) => {
  try {
    const { coin, amount } = req.body || {};
    if (!coin) return res.status(422).json({ msg: 'Coin is required' });
    if (amount === undefined || amount === null) return res.status(422).json({ msg: 'Amount is required' });

    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) return res.status(422).json({ msg: 'Invalid amount' });

    const deposit = { coin, amount: amt, date: new Date() };

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { wallet: deposit }, $inc: { balance: amt } },
      { new: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'Deposit successful', balance: updated.balance, wallet: updated.wallet || [] });
  } catch (err) {
    console.error('/wallet/deposit error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.get('/api/wallet/history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wallet balance');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ wallet: user.wallet || [], balance: user.balance || 0 });
  } catch (err) {
    console.error('/wallet/history error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------- Withdrawals (user) ----------
app.post('/api/wallet/withdraw-request', authMiddleware, async (req, res) => {
  try {
    const { coin, amount } = req.body || {};
    if (!coin) return res.status(422).json({ msg: 'Coin is required' });
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) return res.status(422).json({ msg: 'Invalid amount' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.balance < amt) return res.status(400).json({ msg: 'Insufficient balance' });

    const withdrawal = { coin, amount: amt, status: 'pending', date: new Date() };

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { withdrawals: withdrawal } },
      { new: true, select: 'withdrawals' }
    ).lean();

    console.log(`[withdraw-request] user=${req.user.id} coin=${coin} amount=${amt}`);
    return res.json({ msg: 'Withdrawal request submitted', withdrawal: updated.withdrawals.slice(-1)[0], withdrawals: updated.withdrawals });
  } catch (err) {
    console.error('/wallet/withdraw-request error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

app.get('/api/wallet/withdrawals', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('withdrawals');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json({ withdrawals: user.withdrawals || [] });
  } catch (err) {
    console.error('/wallet/withdrawals error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// ---------- Investments ----------
// GET /api/user/investments


router.get('/investments', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('investments');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const history = (user.investments || []).map((inv) => ({
      date: inv.date || inv.createdAt || new Date(), // fallback if no date
      amount: inv.amount || 0
    }));

    res.json({ history });
  } catch (err) {
    console.error('Investment history error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});




// ---------- Admin helpers ----------
async function requireAdmin(req, res, next) {
  try {
    const adminUser = await User.findById(req.user.id).select('role');
    if (!adminUser) return res.status(404).json({ msg: 'Admin user not found' });
    if (adminUser.role !== 'admin') return res.status(403).json({ msg: 'Forbidden: admin only' });
    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}

// ---------- Admin: user list, credit, investment status ----------
app.get('/api/admin/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, parseInt(req.query.limit || '100', 10));
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('_id email balance investments role wallet withdrawals')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments();
    res.json({ users, meta: { total, page, limit } });
  } catch (err) {
    console.error('/admin/users error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/admin/credit', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId, amount } = req.body || {};
    if (!userId || !isObjectId(userId)) return res.status(422).json({ msg: 'Valid userId is required' });
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) return res.status(422).json({ msg: 'Amount must be a positive number' });

    const updated = await User.findByIdAndUpdate(userId, { $inc: { balance: amt } }, { new: true }).select('_id email balance');
    if (!updated) return res.status(404).json({ msg: 'Target user not found' });

    res.json({ msg: 'User credited', user: updated });
  } catch (err) {
    console.error('/admin/credit error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/admin/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId, investIndex, newStatus } = req.body || {};
    if (!userId || !isObjectId(userId)) return res.status(422).json({ msg: 'Valid userId is required' });
    const idx = Number(investIndex);
    if (!Number.isInteger(idx) || idx < 0) return res.status(422).json({ msg: 'Valid investIndex required' });
    if (!newStatus || typeof newStatus !== 'string') return res.status(422).json({ msg: 'newStatus required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'Target user not found' });
    if (!Array.isArray(user.investments) || idx >= user.investments.length) return res.status(422).json({ msg: 'Investment index out of range' });

    user.investments[idx].status = newStatus;
    await user.save();
    res.json({ msg: 'Investment status updated', investment: user.investments[idx] });
  } catch (err) {
    console.error('/admin/status error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------- Admin: withdrawals management ----------
app.get('/api/admin/withdrawals', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ 'withdrawals.0': { $exists: true } })
      .select('_id email withdrawals')
      .lean();

    console.log(`[admin/withdrawals] found ${users.length} user(s) with withdrawals`);
    res.json({ users });
  } catch (err) {
    console.error('/admin/withdrawals error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/admin/withdrawals/update', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId, index, status } = req.body || {};
    if (!userId || !isObjectId(userId)) return res.status(422).json({ msg: 'Valid userId required' });
    if (!['approved', 'rejected'].includes(status)) return res.status(422).json({ msg: 'Invalid status' });
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0) return res.status(422).json({ msg: 'Valid index required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (!user.withdrawals || !user.withdrawals[idx]) return res.status(404).json({ msg: 'Withdrawal not found' });

    // Approve: deduct balance
    if (status === 'approved') {
      if (user.balance < user.withdrawals[idx].amount) {
        return res.status(400).json({ msg: 'Insufficient balance to approve' });
      }
      user.balance -= user.withdrawals[idx].amount;
    }

    user.withdrawals[idx].status = status;
    await user.save();

    res.json({ msg: `Withdrawal ${status}`, withdrawals: user.withdrawals });
  } catch (err) {
    console.error('/admin/withdrawals/update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ---------- Utility ----------
function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal server error' });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

