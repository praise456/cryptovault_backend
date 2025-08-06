// routes/wallet.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/wallet/deposit
 * Body: { coin, amount }
 * Header: x-auth-token
 */
router.post('/deposit', auth, async (req, res) => {
  try {
    const { coin, amount } = req.body || {};

    // Validation
    if (!coin) return res.status(422).json({ msg: 'Coin is required' });
    if (amount === undefined || amount === null) return res.status(422).json({ msg: 'Amount is required' });

    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) return res.status(422).json({ msg: 'Invalid deposit amount' });

    // Build deposit object
    const deposit = {
      coin,
      amount: amt,
      date: new Date(),
    };

    // Atomic update: push deposit and increment balance in a single DB operation
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: { wallet: deposit },
        $inc: { balance: amt },
      },
      { new: true, useFindAndModify: false }
    ).select('-password');

    if (!updated) return res.status(404).json({ msg: 'User not found' });

    return res.json({ msg: 'Deposit successful', balance: updated.balance, wallet: updated.wallet || [] });
  } catch (err) {
    console.error('Deposit error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/wallet/history
 * Header: x-auth-token
 */
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wallet balance');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json({ wallet: user.wallet || [], balance: user.balance || 0 });
  } catch (err) {
    console.error('Wallet history error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
