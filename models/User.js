// models/User.js
const mongoose = require('mongoose');

// ✅ Define sub-schemas FIRST
const investmentSchema = new mongoose.Schema({
  plan: String,
  amount: Number,
  roi: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'active' }
});

const withdrawalSchema = new mongoose.Schema({
  coin: String,
  amount: Number,
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});

const walletSchema = new mongoose.Schema({
  coin: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});

// ✅ Now define the main User schema
const UserSchema = new mongoose.Schema({
  name: { type: String }, // For dashboard name display
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  investments: [investmentSchema], // No error now
  withdrawals: [withdrawalSchema],
  wallet: [walletSchema]
}, { timestamps: true });

// ✅ Prevent OverwriteModelError in Render hot reload
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
