// routes/investments.js
const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// POST /api/investments/create
router.post("/create", auth, async (req, res) => {
  try {
    const { plan, amount, duration, rate } = req.body;

    // Basic validation
    if (!plan || !amount || !duration || !rate) {
      return res.status(422).json({ msg: "plan, amount, duration and rate are required" });
    }
    const amt = Number(amount);
    const dur = Number(duration);
    const r = Number(rate);
    if (Number.isNaN(amt) || amt <= 0) return res.status(422).json({ msg: "Invalid amount" });
    if (Number.isNaN(dur) || dur <= 0) return res.status(422).json({ msg: "Invalid duration" });
    if (Number.isNaN(r) || r < 0) return res.status(422).json({ msg: "Invalid rate" });

    const start = new Date();
    const end = new Date(start.getTime() + dur * 24 * 60 * 60 * 1000); // duration in days
    const profit = parseFloat((amt * (r / 100)).toFixed(2));

    const newPlan = {
      plan,
      amount: amt,
      rate: r,
      start,
      end,
      profit,
      status: "active",
    };

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.investments = user.investments || [];
    user.investments.push(newPlan);
    await user.save();

    return res.json({ msg: "Investment plan created", investments: user.investments });
  } catch (err) {
    console.error("Create investment error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/investments
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.json({ investments: user.investments || [] });
  } catch (err) {
    console.error("Fetch investments error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
