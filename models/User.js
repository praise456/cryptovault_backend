const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 2000 },
  investments: { type: Array, default: [] }
});

module.exports = mongoose.model('User', UserSchema);
