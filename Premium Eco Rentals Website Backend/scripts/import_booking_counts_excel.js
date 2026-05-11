import xlsx from 'xlsx';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import connectToMongoDB from '../config/db.js';
import { sendMilestoneEmail } from '../utils/mailer.js';

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
    console.log('[DEBUG] Row keys:', Object.keys(row));
  // Assume Excel has columns: email, customerName, bookingCount
  // Use headers: 'Email', 'Customer', 'Booking Count'
  let email = row['Email'];
  let customerName = row['Customer'];
  let bookingCount = row['BookingCount'];
  // Trim spaces from email and customerName
  if (typeof email === 'string') email = email.trim();
  if (typeof customerName === 'string') customerName = customerName.trim();
  console.log(`[DEBUG] Processing row: email='${email}', customerName='${customerName}', bookingCount='${bookingCount}'`);
  if (!email && !customerName) {
    console.warn(`[DEBUG] Skipping row: missing email and customerName`);
    return;
  }
  const user = await User.findOne(email ? { email } : { customerName });
  if (!user) {
    console.warn(`[DEBUG] No user found for row: email='${email}', customerName='${customerName}'`);
    return;
  } else {
    console.log(`[DEBUG] Found user: email='${user.email}', customerName='${user.customerName}', username='${user.username}'`);
  }
  const prevCount = user.bookingCount || 0;
  const newCount = parseInt(bookingCount, 10);
  if (isNaN(newCount) || newCount <= prevCount) return;
  user.bookingCount = newCount;
  // Award milestones for any new ones reached
  for (const milestone of Object.keys(MILESTONES).map(Number)) {
    if (prevCount < milestone && newCount >= milestone && !user.milestonesClaimed.includes(milestone)) {
      if (typeof user.points !== 'number') user.points = 0;
      user.points += MILESTONES[milestone];
      user.milestonesClaimed.push(milestone);
      console.log(`Awarded ${MILESTONES[milestone]} points to ${user.email || user.customerName} for milestone ${milestone}`);
      // Send milestone email notification
      if (user.email) {
        try {
          await sendMilestoneEmail(user.email, user.customerName || user.username || user.email, milestone, MILESTONES[milestone]);
        } catch (e) {
          console.error('Failed to send milestone email:', e.message);
        }
      }
    }
  }
  await user.save();
}

// Usage: node scripts/import_booking_counts_excel.js bookings.xlsx
if (process.argv.length < 3) {
  console.error('Usage: node scripts/import_booking_counts_excel.js bookings.xlsx');
  process.exit(1);
}

processExcel(process.argv[2]);
