// Script to set a user's dateOfBirth to today for testing birthday claim
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { MONGODB_URI } from '../config/env.js';

async function setBirthdayToday(userId) {
  await mongoose.connect(MONGODB_URI);
  const today = new Date();
  today.setUTCHours(0,0,0,0);
  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found');
    await mongoose.disconnect();
    return;
  }
  user.dateOfBirth = today;
  await user.save();
  console.log('Set dateOfBirth to today for userId', userId);
  await mongoose.disconnect();
}

// Usage: set the userId below
setBirthdayToday('69e7039bdf3398f30e9b00fe');
