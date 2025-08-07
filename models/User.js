// models/User.js
const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  plan: String,
  amount: Number,
  rate: Number,
  start: Date,
  end: Date,
  profit: Number,
  status: { type: String, default: 'active' },
}, { _id: false });

const walletEntrySchema = new mongoose.Schema({
  coin: String,
  amount: Number,
  date: { type: Date, default: Date.now },
}, { _id: false });

const withdrawalSchema = new mongoose.Schema({
  coin: String,
  amount: Number,
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  date: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'user' or 'admin'
  balance: { type: Number, default: 0 },
  investments: [investmentSchema],
  wallet: [walletEntrySchema],
  withdrawals: [withdrawalSchema]
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);
