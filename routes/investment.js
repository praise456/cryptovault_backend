const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// POST /api/investments/create
router.post("/create", auth, async (req, res) => {
  const { plan, amount, duration, rate } = req.body;

  const start = new Date();
  const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000); // duration in days
  const profit = parseFloat((amount * (rate / 100)).toFixed(2));

  const newPlan = {
    plan,
    amount,
    rate,
    start,
    end,
    profit,
    status: "active"
  };

  const user = await User.findById(req.user.id);
  user.investments = user.investments || [];
  user.investments.push(newPlan);
  await user.save();

  res.json({ msg: "Investment plan created", investments: user.investments });
});

// GET /api/investments
router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ investments: user.investments || [] });
});
module.exports = router;