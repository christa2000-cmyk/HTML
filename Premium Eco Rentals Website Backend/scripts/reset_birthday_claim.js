// Script to remove this year's birthday claim from a user's loyalty transactions for testing
import mongoose from 'mongoose';
import Loyalty from '../models/loyalty.model.js';
import { MONGODB_URI } from '../config/env.js';

async function resetBirthdayClaim(userId) {
  await mongoose.connect(MONGODB_URI);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const loyalty = await Loyalty.findOne({ userId });
  if (!loyalty) {
    console.log('No loyalty account found for user');
    await mongoose.disconnect();
    return;
  }
  loyalty.transactions = loyalty.transactions.filter(tx => {
    if (tx.type !== 'bonus') return true;
    if (!tx.description || !tx.description.startsWith('Birthday points')) return true;
    const txYear = new Date(tx.date).getUTCFullYear();
    return txYear !== currentYear;
  });
  await loyalty.save();
  console.log('Birthday claim reset for userId', userId);
  await mongoose.disconnect();
}

// Usage: set the userId below
resetBirthdayClaim('69e7039bdf3398f30e9b00fe');
