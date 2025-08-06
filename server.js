require('dotenv').config();
const express = require('express');

const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const app = express();

app.use(cors());

// ✅ If you want to restrict to your frontend's domain in production:
 // app.use(cors({ origin: 'https://yourfrontenddomain.com' }));

app.use(express.json());

// ✅ Mount routes AFTER cors() and express.json()
app.use('/api', require('./routes/auth'));

// ... your other routes ...
const uri = 'mongodb+srv://admin:Stellar43@cluster0.xly04mf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('MongoDB connected Succesfullly');
 })
.catch((error) => {
  console.error(' MongoDB Connection error;', error);
});

app.use('/api', authRoutes);

app.get('/user', async (req, res) => {
  const token = req.header('x-auth-token') || (req.header('authorization') || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET missing');
      return res.status(500).json({ msg: 'Server config error' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ msg: 'Invalid token' });
    res.json(user);
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
});

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal server error' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
