const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// Send email verification
router.post("/send-verification", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const link = `https://crypto-backend-t3bz.onrender.com//verify.html?token=${token}`;
  const html = `<h3>Verify your email</h3><p><a href="${link}">Click here to verify</a></p>`;
  await sendEmail(email, "Verify Your Email", html);
  res.json({ msg: "Verification email sent" });
});

// Verify email link
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(decoded.id, { verified: true });
    res.redirect("https://crypto-backend-t3bz.onrender.com//verify.html");
  } catch (e) {
    res.status(400).send("Invalid or expired token");
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const link = `https://crypto-backend-t3bz.onrender.com//reset-password.html?token=${token}`;
  const html = `<h3>Reset your password</h3><p><a href="${link}">Click here to reset</a></p>`;
  await sendEmail(email, "Reset Password", html);
  res.json({ msg: "Reset email sent" });
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(decoded.id, { password: hashed });
    res.json({ msg: "Password updated" });
  } catch (e) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
