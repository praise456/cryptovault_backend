const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   ssl: true,
})
.then(() => {
  console.log('MongoDB connected Succesfullly');
 })
.catch((error) => {
  console.error(' MongoDB Connection error;', error);
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
