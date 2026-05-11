// Migration script to add dateOfBirth field to all users if missing
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dbConfig from '../config/db.js';

(async () => {
  await dbConfig();
  const result = await User.updateMany(
    { dateOfBirth: { $exists: false } },
    { $set: { dateOfBirth: null } }
  );
  console.log('Users updated:', result.modifiedCount);
  process.exit(0);
})();
