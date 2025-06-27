import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import onboardRoutes from './backend/routes/onboard.js'; // Add .js for ES modules

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
