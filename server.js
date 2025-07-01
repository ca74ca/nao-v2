require('dotenv').config(); // Load env variables first

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const onboardRoutes = require('./backend/routes/onboard');
const verifyRoutes = require('./backend/routes/verifyWorkout');

const app = express();
const PORT = process.env.PORT || 3001;

// Log out your MongoDB URI for debugging (remove this in production!)
console.log("Connecting to MongoDB with URI:", process.env.MONGODB_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ Mongoose connected!');
  })
  .catch((err) => {
    console.error('❌ Mongoose error:', err);
  });

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Health check route
app.get('/', (_, res) => {
  res.send('✅ NAO API running');
});

// Route setup
app.use('/onboard', onboardRoutes);
app.use('/api', verifyRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`✅ NAO backend live on port ${PORT}`);
});