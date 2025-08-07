// models/User.js
const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  roi: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "pending" }
});

const withdrawalSchema = new mongoose.Schema({
  coin: String,
  amount: Number,
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  date: { type: Date, default: Date.now }
}, { _id: false });


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  investments: { type: Array, default: [] },
  withdrawals: { type: Array, default: [] },
  wallet: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
