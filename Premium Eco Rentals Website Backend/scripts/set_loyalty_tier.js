// Script to set a user's loyalty tier and points for birthday claim eligibility
import mongoose from 'mongoose';
import Loyalty from '../models/loyalty.model.js';
import { MONGODB_URI } from '../config/env.js';

async function setLoyaltyTier(userId, tier, points) {
  await mongoose.connect(MONGODB_URI);
  const result = await Loyalty.updateOne(
    { userId: userId },
    { $set: { tier: tier, lifetimePoints: points, pointsBalance: points } }
  );
  console.log(`Updated loyalty for userId ${userId}:`, result);
  await mongoose.disconnect();
}

// Usage: set the userId, tier, and points below
setLoyaltyTier('69e7039bdf3398f30e9b00fe', 'Silver', 3000);
