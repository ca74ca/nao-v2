// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const onboardRoutes = require('./backend/routes/onboard'); // Make sure path is correct

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (_, res) => {
  res.send('✅ NAO API running');
});

app.use('/onboard', onboardRoutes);

app.listen(PORT, () => {
  console.log(`✅ NAO backend live on port ${PORT}`);
});
