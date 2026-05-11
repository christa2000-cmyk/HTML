// Script to reset both birthday and signup gift claims for a user for testing
import mongoose from 'mongoose';
import Loyalty from '../models/loyalty.model.js';
import { MONGODB_URI } from '../config/env.js';

async function resetClaims(userId) {
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
    // Remove this year's birthday claim
    if (tx.type === 'bonus' && tx.description && tx.description.startsWith('Birthday points')) {
      const txYear = new Date(tx.date).getUTCFullYear();
      if (txYear === currentYear) return false;
    }
    // Remove signup gift claim
    if (tx.type === 'bonus' && tx.description && tx.description.startsWith('Signup gift')) {
      return false;
    }
    return true;
  });
  await loyalty.save();
  console.log('Birthday and signup gift claims reset for userId', userId);
  await mongoose.disconnect();
}

// Usage: set the userId below
resetClaims('69e7039bdf3398f30e9b00fe');
