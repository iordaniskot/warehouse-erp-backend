import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { log } from './utils/logger';
import { connectDB } from './config/db';
import routes from './routes';
import { notFound, errorHandler } from './middleware/error';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export const start = async () => {
  await connectDB();
  const port = process.env.PORT || 4000;
  app.listen(port, () => log(`Server listening on port ${port}`));
};

export default app;
