import mongoose from 'mongoose';
import { MONGODB_URI , NODE_ENV } from '../config/env.js';



if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables inside .env.<developement/production>.local");
}

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`Connected to MongoDB in ${NODE_ENV} mode`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};

export default connectToMongoDB;

