// Script to restore a user's loyalty tier and points to Platinum and 14,575
import mongoose from 'mongoose';
import Loyalty from '../models/loyalty.model.js';
import { MONGODB_URI } from '../config/env.js';

async function restoreLoyalty(userId) {
  await mongoose.connect(MONGODB_URI);
  const result = await Loyalty.updateOne(
    { userId: userId },
    { $set: { tier: 'Platinum', lifetimePoints: 14575, pointsBalance: 14575 } }
  );
  console.log(`Restored loyalty for userId ${userId}:`, result);
  await mongoose.disconnect();
}

// Usage: set the userId below
restoreLoyalty('69e7039bdf3398f30e9b00fe');
