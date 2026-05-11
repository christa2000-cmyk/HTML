// Script to set customerName for all users missing it
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dbConfig from '../config/db.js';

(async () => {
  try {
    await dbConfig();
    const users = await User.find({ $or: [ { customerName: { $exists: false } }, { customerName: '' } ] });
    for (const user of users) {
      user.customerName = user.username || user.email || 'Loyalty Member';
      await user.save();
      console.log(`Updated user ${user.email}: customerName set to '${user.customerName}'`);
    }
    console.log('All missing customerName fields have been set.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating users:', err);
    process.exit(1);
  }
})();
