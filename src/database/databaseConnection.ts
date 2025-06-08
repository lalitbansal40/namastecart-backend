import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CONSTANTS } from '../config/constant';

dotenv.config();


export const connectDB = async () => {
    try {
        await mongoose.connect(CONSTANTS.DATABASE.MONGO_URI); // No need for options in Mongoose 6+
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
