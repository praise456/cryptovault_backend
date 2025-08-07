// models/User.js
const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  roi: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const withdrawalSchema = new mongoose.Schema({
  coin: String,
  amount: Number,
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  date: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true }, // 👈 Add this
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  investments: { type: Array, default: [] },
  withdrawals: { type: Array, default: [] },
  wallet: { type: Array, default: [] },
  role: { type: String, default: "user" }
});

module.exports = mongoose.model('User', userSchema);
