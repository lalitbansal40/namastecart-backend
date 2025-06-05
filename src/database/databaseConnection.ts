import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = String(process.env.MONGO_URI);

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI); // No need for options in Mongoose 6+
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
