const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Admin middleware (assumes isAdmin flag on user)
const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.isAdmin) return res.status(403).json({ error: "Access denied" });
  next();
};

// GET /api/admin/users
router.get("/users", auth, isAdmin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ users });
});

// POST /api/admin/credit
router.post("/credit", auth, isAdmin, async (req, res) => {
  const { userId, amount } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.balance += Number(amount);
  await user.save();
  res.json({ msg: "User credited", balance: user.balance });
});

// POST /api/admin/status
router.post("/status", auth, isAdmin, async (req, res) => {
  const { userId, investIndex, newStatus } = req.body;
  const user = await User.findById(userId);
  if (!user || !user.investments[investIndex]) return res.status(404).json({ error: "Investment not found" });

  user.investments[investIndex].status = newStatus;
  await user.save();
  res.json({ msg: "Status updated", investment: user.investments[investIndex] });
});

module.exports = router;
