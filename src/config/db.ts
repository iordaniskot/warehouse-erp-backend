import mongoose from 'mongoose';
import { log, error } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    log('MongoDB connected');
  } catch (err) {
    error('MongoDB connection error', err);
    process.exit(1);
  }
};
