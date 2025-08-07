const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  roi: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  date: { type: Date, default: Date.now }
});

const WithdrawalSchema = new mongoose.Schema({
  coin: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  date: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  role: { type: String, default: 'user' }, // 'user' or 'admin'
  wallet: [
    {
      coin: String,
      amount: Number,
      date: { type: Date, default: Date.now }
    }
  ],
{ timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
