const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// POST /api/wallet/deposit
router.post("/deposit", auth, async (req, res) => {
  const { coin, amount } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const deposit = {
    coin,
    amount,
    date: new Date()
  };

  user.wallet = user.wallet || [];
  user.wallet.push(deposit);
  user.balance += Number(amount);
  await user.save();

  res.json({ msg: "Deposit successful", balance: user.balance });
});

// GET /api/wallet/history
router.get("/history", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ wallet: user.wallet || [] });
});

module.exports = router;