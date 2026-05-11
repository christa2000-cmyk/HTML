
console.log('--- TOP-LEVEL: Script execution started ---');
let MONGODB_URI;
try {
  // Try to import env config
  const env = await import('./config/env.js');
  MONGODB_URI = env.MONGODB_URI;
  console.log('--- TOP-LEVEL: MONGODB_URI imported:', MONGODB_URI);
} catch (err) {
  console.error('--- TOP-LEVEL: Error importing MONGODB_URI from env.js ---');
  if (err && err.message) console.error('Message:', err.message);
  if (err && err.stack) console.error('Stack:', err.stack);
  else console.error(err);
  process.exit(1);
}

import mongoose from 'mongoose';
import User from './models/user.model.js';

async function main() {
  try {
    console.log('--- DEBUG: Script started ---');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI from env:', process.env.MONGODB_URI);
    console.log('MONGODB_URI from import:', MONGODB_URI);
    if (!MONGODB_URI) {
      console.error('MONGODB_URI is not defined. Check your .env file and config/env.js.');
      process.exit(1);
    }
    console.log('Connecting to MongoDB:', MONGODB_URI);
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB.');
    } catch (connErr) {
      console.error('--- MONGOOSE CONNECTION ERROR ---');
      console.error('Tried URI:', MONGODB_URI);
      if (connErr && connErr.message) console.error('Message:', connErr.message);
      if (connErr && connErr.stack) console.error('Stack:', connErr.stack);
      else console.error(connErr);
      process.exit(2);
    }
    const users = await User.find();
    console.log('User query completed.');
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log(`Found ${users.length} user(s):`);
      users.forEach((u, i) => console.log(`${i + 1}.`, u));
    }
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    console.log('--- DEBUG: Script finished successfully ---');
  } catch (err) {
    console.error('--- ERROR OCCURRED ---');
    if (err && err.message) {
      console.error('Message:', err.message);
    }
    if (err && err.stack) {
      console.error('Stack:', err.stack);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();