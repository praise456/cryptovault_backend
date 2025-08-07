// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'user' or 'admin'
  balance: { type: Number, default: 0 },
  investments: [investmentSchema],
  wallet: [walletEntrySchema],
  withdrawals: [withdrawalSchema]
}, { timestamps: true });


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
});;



module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
