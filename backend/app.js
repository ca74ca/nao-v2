require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const verifyWorkout   = require('./routes/verifyWorkout');
const getRewardStatus = require('./routes/getRewardStatus');
const historyRoute    = require('./routes/history');
const dailyGreeting   = require('./routes/dailyGreeting'); // ✅ Move require here

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Register API routes
app.use('/api', verifyWorkout);
app.use('/api', getRewardStatus);
app.use('/api', historyRoute);
app.use('/api', dailyGreeting); // ✅ Register outside of listen

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});