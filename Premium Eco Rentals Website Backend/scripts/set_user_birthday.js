// Script to set a user's dateOfBirth to a specific date (e.g., today)
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { MONGODB_URI } from '../config/env.js';

async function setBirthday(email, dateString) {
  await mongoose.connect(MONGODB_URI);
  const result = await User.updateOne(
    { email: email },
    { $set: { dateOfBirth: new Date(dateString) } }
  );
  console.log(`Updated user ${email}:`, result);
  await mongoose.disconnect();
}

// Usage: set the email and date below
setBirthday('christa2000@gmail.com', '2026-04-30');
