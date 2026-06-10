import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection } from '../config/database.js';
import routes from '../routes/index.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',').map(s => s.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();