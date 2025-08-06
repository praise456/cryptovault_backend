const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = 'mongodb+srv://admin:<db_password>@cluster0.xly04mf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
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
