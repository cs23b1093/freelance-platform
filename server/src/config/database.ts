import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { error } from 'console';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_platform';
    
    await mongoose.connect(mongoURI).then((response) => {
        logger.info (`mongodb connected successfully to: ${response.connection.host}`)
    })
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;