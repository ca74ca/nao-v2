require('dotenv').config(); // Load env variables first

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const onboardRoutes = require('./backend/routes/onboard');
const verifyRoutes = require('./backend/routes/verifyWorkout');
const rewardRoutes = require('./backend/routes/getRewardStatus');
const historyRoutes = require('./backend/routes/history'); // ✅ Added for workout history
const dailyGreetingRoutes = require('./backend/routes/dailyGreeting'); // ✅ Optional: include if needed

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ MongoDB connection
console.log("Connecting to MongoDB with URI:", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Mongoose connected!'))
  .catch((err) => console.error('❌ Mongoose error:', err));

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Health check route
app.get('/', (_, res) => res.send('✅ NAO API running'));

// ✅ Routes
app.use('/onboard', onboardRoutes);
app.use('/api', verifyRoutes);
app.use('/api', rewardRoutes);
app.use('/api', historyRoutes);         // ✅ History route added here
app.use('/api', dailyGreetingRoutes);   // ✅ Optional: daily greeting route

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ NAO backend live on port ${PORT}`);
});
