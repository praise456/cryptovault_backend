// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  investments: [
    {
      plan: String,
      amount: Number,
      roi: Number,
      date: { type: Date, default: Date.now },
      status: { type: String, default: 'active' }
    }
  ],
  withdrawals: [
    {
      coin: String,
      amount: Number,
      date: { type: Date, default: Date.now },
      status: { type: String, default: 'pending' }
    }
  ],
  wallet: [
    {
      coin: String,
      amount: Number,
      date: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true }); // ✅ This is where you use timestamps

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);

