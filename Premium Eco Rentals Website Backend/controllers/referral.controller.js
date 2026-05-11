// Get referral stats for a user (referrer)
export const getReferralStats = async (req, res) => {
  try {
    // Accept userId, referralCode, loyaltyId, or username as query param
    const { userId, referralCode, loyaltyId, username } = req.query;
    let referrer;
    if (userId) {
      referrer = await User.findById(userId);
    } else if (referralCode) {
      referrer = await User.findOne({ referralCode });
    } else if (loyaltyId) {
      referrer = await User.findOne({ loyaltyId });
    } else if (username) {
      referrer = await User.findOne({ username });
    } else {
      return res.status(400).json({ message: 'userId, referralCode, loyaltyId, or username is required.' });
    }
    if (!referrer) {
      return res.status(404).json({ message: 'Referrer not found.' });
    }
    // If user is missing a referralCode, generate and save one
    if (!referrer.referralCode) {
      referrer.referralCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      await referrer.save();
    }
    // Find all referrals for this referrer
    const referrals = await Referral.find({ referrerCode: referrer.referralCode })
      .populate('referredUser', 'email customerName username')
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(r => r.completed).length;
    const pendingReferrals = totalReferrals - completedReferrals;
    const bonusApplied = referrals.filter(r => r.bonusApplied).length;

    // Prepare detailed list
    const referralDetails = referrals.map(r => ({
      referredUser: r.referredUser ? {
        email: r.referredUser.email,
        customerName: r.referredUser.customerName,
        username: r.referredUser.username
      } : null,
      completed: r.completed,
      completedAt: r.completedAt,
      bonusApplied: r.bonusApplied,
      createdAt: r.createdAt
    }));

    return res.status(200).json({
      referrer: {
        id: referrer._id,
        email: referrer.email,
        customerName: referrer.customerName,
        referralCode: referrer.referralCode
      },
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      bonusApplied,
      referrals: referralDetails
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
import Referral from '../models/referral.model.js';
import User from '../models/user.model.js';
import Loyalty from '../models/loyalty.model.js';

// Admin endpoint: confirm a referral booking
export const confirmReferralBooking = async (req, res) => {
  try {
    const { referredUserEmail } = req.body;
    if (!referredUserEmail) {
      return res.status(400).json({ message: 'Referred user email is required.' });
    }
    const referredUser = await User.findOne({ email: referredUserEmail });
    if (!referredUser) {
      return res.status(404).json({ message: 'Referred user not found.' });
    }
    let referral = await Referral.findOne({ referredUser: referredUser._id });
    if (!referral) {
      // Try to create if not exists (for legacy signups)
      if (!referredUser.referredBy) {
        return res.status(400).json({ message: 'This user was not referred.' });
      }
      referral = await Referral.create({
        referredUser: referredUser._id,
        referrerCode: referredUser.referredBy,
        completed: true,
        completedAt: new Date(),
        bonusApplied: false
      });
    } else {
      referral.completed = true;
      referral.completedAt = new Date();
      await referral.save();
    }

    // Apply bonus if not already applied
    if (!referral.bonusApplied) {
      // Find the referrer by referralCode
      const referrer = await User.findOne({ referralCode: referral.referrerCode });
      if (referrer) {
        let loyalty = await Loyalty.findOne({ userId: referrer._id });
        if (!loyalty) {
          loyalty = await Loyalty.create({ userId: referrer._id });
        }
        const bonusPoints = 250; // Set your referral bonus amount here
        loyalty.pointsBalance += bonusPoints;
        loyalty.lifetimePoints += bonusPoints;
        loyalty.transactions.push({
          type: 'bonus',
          points: bonusPoints,
          description: `Referral bonus for referring ${referredUser.email}`,
          date: new Date()
        });
        await loyalty.save();
        referral.bonusApplied = true;
        await referral.save();
        return res.status(200).json({ message: `Referral marked as completed. ${bonusPoints} points awarded to referrer.` });
      } else {
        return res.status(404).json({ message: 'Referrer not found. Bonus not applied.' });
      }
    }
    return res.status(200).json({ message: 'Referral marked as completed. Bonus was already applied.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
