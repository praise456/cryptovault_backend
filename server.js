const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

dotenv.config();

const express = require('express');
const cors = require('cors'); // ✅ add this

const app = express();

// ✅ Enable CORS for all origins (development)
app.use(cors());

// If you want to restrict in production, use this instead:
// app.use(cors({ origin: 'https://your-frontend-domain.com' }));

// ✅ Parse JSON body before routes
app.use(express.json());

// ✅ Your routes go below
app.use('/api', require('./routes/auth')); 
// ...other routes...

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
