// models/User.js
const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  roi: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  investments: [investmentSchema],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
