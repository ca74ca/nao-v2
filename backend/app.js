require('dotenv').config();
const express = require('express');
const app = express();

const onboardRoute = require('./routes/onboard.js'); // ✅ Correctly imports the fixed onboard route

// Middleware to parse incoming JSON
app.use(express.json());

// Mount onboard route at /onboard (so POST /onboard works)
app.use('/onboard', onboardRoute);

// Health check endpoint (for Render.com)
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Catch-all for invalid routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ NAO backend live on port ${PORT}`);
});
