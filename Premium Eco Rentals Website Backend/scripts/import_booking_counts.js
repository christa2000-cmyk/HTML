import xlsx from 'xlsx';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import connectToMongoDB from '../config/db.js';

// Milestone map: bookingCount => bonus points
const MILESTONES = {
  1: 100,
  5: 150,
  10: 200,
  20: 250,
  50: 500
};

async function processExcel(filePath) {
  await connectToMongoDB();
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  for (const row of rows) {
    await updateUser(row);
  }
  console.log('All users updated.');
  process.exit(0);
}

async function updateUser(row) {
  // Assume Excel has columns: email, customerName, bookingCount
  const { email, customerName, bookingCount } = row;
  if (!email && !customerName) return;
  const user = await User.findOne(email ? { email } : { customerName });
  if (!user) return;
  const prevCount = user.bookingCount || 0;
  const newCount = parseInt(bookingCount, 10);
  if (isNaN(newCount) || newCount <= prevCount) return;
  user.bookingCount = newCount;
  // Award milestones for any new ones reached
  for (const milestone of Object.keys(MILESTONES).map(Number)) {
    if (prevCount < milestone && newCount >= milestone && !user.milestonesClaimed.includes(milestone)) {
      user.points = (user.points || 0) + MILESTONES[milestone];
      user.milestonesClaimed.push(milestone);
      console.log(`Awarded ${MILESTONES[milestone]} points to ${user.email || user.customerName} for milestone ${milestone}`);
    }
  }
  await user.save();
}

// Usage: node scripts/import_booking_counts.js bookings.xlsx
if (process.argv.length < 2) {
  console.error('Usage: node scripts/import_booking_counts.js bookings.xlsx');
  process.exit(1);
}

processExcel(process.argv[2]);
