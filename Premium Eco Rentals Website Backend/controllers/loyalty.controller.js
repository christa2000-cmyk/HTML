// Redeem points for free rental days
export const redeemFreeRentalDay = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });
        const { days } = req.body;
        const validDays = [1, 2, 3, 4];
        if (!validDays.includes(Number(days))) {
            return res.status(400).json({ message: 'Invalid number of days. Must be 1, 2, 3, or 4.' });
        }
        const pointsRequired = 950 * Number(days);
        const loyalty = await Loyalty.findOne({ userId });
        if (!loyalty) return res.status(404).json({ message: 'Loyalty account not found' });
        if (loyalty.pointsBalance < pointsRequired) {
            return res.status(400).json({ message: `Not enough points. You need ${pointsRequired} points for ${days} free rental day(s).` });
        }
        // Use static codes for HQ storage
        const codeMap = {
            1: 'FREEDAY-1-HQ2026A',
            2: 'FREEDAY-2-HQ2026B',
            3: 'FREEDAY-3-HQ2026C',
            4: 'FREEDAY-4-HQ2026D',
        };
        const code = codeMap[days];
        // Deduct points and add transaction
        loyalty.pointsBalance -= pointsRequired;
        loyalty.transactions.push({
            type: 'redeem',
            points: pointsRequired,
            description: `Redeemed for ${days} Free Rental Day(s) [${code}]`,
            date: new Date(),
        });
        await loyalty.save();
        return res.status(200).json({
            message: `Successfully redeemed ${days} free rental day(s).`,
            code,
            pointsBalance: loyalty.pointsBalance,
            daysRedeemed: days,
            pointsSpent: pointsRequired
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
// Get recent activity for the logged-in user
import Loyalty from '../models/loyalty.model.js';
export const getRecentActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });
        const loyalty = await Loyalty.findOne({ userId });
        if (!loyalty) return res.status(404).json({ message: 'Loyalty account not found' });
        // Get the 10 most recent transactions, sorted by date descending
        const showAll = req.query.all === 'true';
        let txs = loyalty.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        let recent;
        if (showAll) {
            recent = txs.map(tx => ({
                type: tx.type,
                description: tx.description,
                points: tx.points,
                date: tx.date
            }));
        } else {
            recent = txs.slice(0, 5).map(tx => ({
                type: tx.type,
                description: tx.description,
                points: tx.points,
                date: tx.date
            }));
        }
        res.status(200).json({ activity: recent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Signup gift claim controller
export const claimSignupGift = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });
        const loyalty = await Loyalty.findOne({ userId });
        if (!loyalty) return res.status(404).json({ message: 'Loyalty account not found' });

        // Check if already claimed (look for a transaction with description 'Signup gift')
        const alreadyClaimed = loyalty.transactions.some(tx =>
            tx.type === 'bonus' &&
            tx.description &&
            tx.description.startsWith('Signup gift')
        );
        if (alreadyClaimed) {
            return res.status(409).json({ message: 'Signup gift already claimed' });
        }

        // Award signup gift (100 points)
        const signupGiftPoints = 100;
        loyalty.pointsBalance += signupGiftPoints;
        loyalty.lifetimePoints += signupGiftPoints;
        loyalty.transactions.push({
            type: 'bonus',
            points: signupGiftPoints,
            description: 'Signup gift',
            date: new Date()
        });
        await loyalty.save();
        return res.status(200).json({
            message: '100 Signup Gift Points added. Enjoy your bonus!',
            pointsAwarded: signupGiftPoints,
            pointsBalance: loyalty.pointsBalance,
            lifetimePoints: loyalty.lifetimePoints
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
// Birthday points claim controller
export const claimBirthdayPoints = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.dateOfBirth) return res.status(400).json({ message: 'Date of birth not set' });

        // Only allow for Silver, Gold, Platinum
        const loyalty = await Loyalty.findOne({ userId });
        if (!loyalty) return res.status(404).json({ message: 'Loyalty account not found' });
        if (!['Silver', 'Gold', 'Platinum'].includes(loyalty.tier)) {
            return res.status(403).json({ message: 'Birthday points only for Silver, Gold, Platinum tiers' });
        }

        // Check if already claimed this year
        const now = new Date();
        const currentYear = now.getFullYear();
        const alreadyClaimed = loyalty.transactions.some(tx =>
            tx.type === 'bonus' &&
            tx.description &&
            tx.description.startsWith('Birthday points') &&
            new Date(tx.date).getFullYear() === currentYear
        );
        if (alreadyClaimed) {
            return res.status(409).json({ message: 'Birthday points already claimed this year' });
        }

                // Check if today is user's birthday (UTC-safe)
                const dob = new Date(user.dateOfBirth);
                if (
                    dob.getUTCMonth() !== now.getUTCMonth() ||
                    dob.getUTCDate() !== now.getUTCDate()
                ) {
                    return res.status(400).json({ message: 'Today is not your birthday' });
                }

        // Award birthday points (200 points)
        const birthdayPoints = 200;
        loyalty.pointsBalance += birthdayPoints;
        loyalty.lifetimePoints += birthdayPoints;
        loyalty.transactions.push({
            type: 'bonus',
            points: birthdayPoints,
            description: `Birthday points for ${currentYear}`,
            date: now
        });
        await loyalty.save();
        return res.status(200).json({
            message: '200 Birthday Points added today. Enjoy your bonus. Happy Birthday!',
            pointsAwarded: birthdayPoints,
            pointsBalance: loyalty.pointsBalance,
            lifetimePoints: loyalty.lifetimePoints
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

import User from '../models/user.model.js';
import mongoose from 'mongoose';
import { ADMIN_TOKEN } from '../config/env.js';

const TIER_MULTIPLIER = {
    Bronze: 1.0,
    Silver: 1.25,
    Gold: 1.5,
    Platinum: 2.0,
};

const DEFAULT_BASE_RATE = 1;

const getTierMultiplier = (tier = 'Bronze') => TIER_MULTIPLIER[tier] ?? TIER_MULTIPLIER.Bronze;

const normalizeMoney = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
        return null;
    }
    return Math.round(amount * 100) / 100;
};

const calculateEarnedPoints = ({ eligibleSpend, tier, baseRate = DEFAULT_BASE_RATE }) => {
    const spend = normalizeMoney(eligibleSpend);
    const rate = Number(baseRate);

    if (spend === null || !Number.isFinite(rate) || rate <= 0) {
        return null;
    }

    const multiplier = getTierMultiplier(tier);
    return Math.floor(spend * rate * multiplier);
};

export const earnPoints = async (req, res) => {
    try {
        const requestedUserId = req.body.userId;
        const authenticatedUserId = req.user?.userId;
        const userId = authenticatedUserId || requestedUserId;
        const { eligibleSpend, baseRate, description, customerName } = req.body;
        // Debug logging for troubleshooting ObjectId/email issues (after resolving user)
        // This will help trace any ObjectId/email confusion
        // Only log after user and effectiveUserId are set
        // (Do not move above this point)

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        // Allow batch import with special admin token
        const authHeader = req.headers.authorization || '';
        const isAdmin = authHeader.replace('Bearer ', '') === ADMIN_TOKEN;
        if (!isAdmin && authenticatedUserId && requestedUserId && authenticatedUserId !== requestedUserId) {
            return res.status(403).json({ message: 'You can only add points to your own loyalty account' });
        }

        const spend = normalizeMoney(eligibleSpend);
        if (spend === null || spend <= 0) {
            return res.status(400).json({ message: 'eligibleSpend must be a positive number' });
        }

        // If userId is a valid ObjectId, look up by _id; otherwise, try by email
        let user;
        let effectiveUserId = userId;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }
        if (!user) {
            // Try finding by email (case-insensitive)
            user = await User.findOne({ email: new RegExp('^' + userId + '$', 'i') });
            if (user) {
                effectiveUserId = user._id;
            }
        }
        // Debug logging after resolving user and effectiveUserId
        console.log('[earnPoints] userId from request:', userId);
        console.log('[earnPoints] effectiveUserId:', effectiveUserId);
        if (user) {
            console.log('[earnPoints] user._id:', user._id, '| user.email:', user.email);
        } else {
            console.log('[earnPoints] user not found for userId:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        // Update customerName if provided
        if (customerName && customerName.trim()) {
            user.customerName = customerName.trim();
            await user.save();
        }

        let loyalty = await Loyalty.findOne({ userId: effectiveUserId });

        if (!loyalty) {
            loyalty = await Loyalty.create({ userId: effectiveUserId });
            user.loyaltyId = loyalty._id;

            if (user.accountType === 'standard_premium' || user.accountType === 'premium_plus') {
                user.accountType = 'loyalty';
            } else if (user.accountType === 'premium_elite') {
                user.accountType = 'elite';
            }

            await user.save();
        }

        const points = calculateEarnedPoints({
            eligibleSpend: spend,
            tier: loyalty.tier,
            baseRate,
        });

        if (!points || points < 1) {
            return res.status(400).json({
                message: 'Calculated points must be at least 1. Increase spend or baseRate.',
            });
        }

        loyalty.pointsBalance += points;
        loyalty.lifetimePoints += points;

        loyalty.transactions.push({
            type: 'earn',
            points,
            description: description?.trim() || `Earned from $${spend} eligible spend`,
        });

        await loyalty.save();

        // Calculate points needed for Bronze if no tier
        let pointsToBronze = null;
        if (!loyalty.tier) {
            pointsToBronze = 1500 - loyalty.lifetimePoints;
        }
        return res.status(200).json({
            message: 'Points added successfully',
            data: {
                userId: effectiveUserId,
                spend,
                pointsEarned: points,
                tier: loyalty.tier,
                pointsBalance: loyalty.pointsBalance,
                lifetimePoints: loyalty.lifetimePoints,
                pointsToBronze,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// Dashboard endpoint: returns tier, points, and points needed for Bronze if no tier
export const getDashboard = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });
        const loyalty = await Loyalty.findOne({ userId });
        if (!loyalty) return res.status(404).json({ message: 'Loyalty account not found' });
        // Fetch user for name and birthday
        const user = await User.findById(userId);
        let pointsToBronze = null;
        if (!loyalty.tier) {
            pointsToBronze = 1500 - loyalty.lifetimePoints;
        }

        // Check if today is user's birthday (UTC-safe)
        let isBirthday = false;
        let birthdayClaimed = false;
        let signupGiftClaimed = false;
        if (user && user.dateOfBirth) {
            const now = new Date();
            const dob = new Date(user.dateOfBirth);
            if (
                dob.getUTCMonth() === now.getUTCMonth() &&
                dob.getUTCDate() === now.getUTCDate()
            ) {
                isBirthday = true;
            }
        }
        // Check if birthday points already claimed this year
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        if (loyalty.transactions.some(tx =>
            tx.type === 'bonus' &&
            tx.description &&
            tx.description.startsWith('Birthday points') &&
            new Date(tx.date).getUTCFullYear() === currentYear
        )) {
            birthdayClaimed = true;
        }
        // Check if signup gift already claimed
        if (loyalty.transactions.some(tx =>
            tx.type === 'bonus' &&
            tx.description &&
            tx.description.startsWith('Signup gift')
        )) {
            signupGiftClaimed = true;
        }

        // Milestone info
        const bookingCount = user?.bookingCount || 0;
        const milestonesClaimed = user?.milestonesClaimed || [];
        const MILESTONES = [1, 5, 10, 20, 50];
        // Find the next milestone strictly greater than the highest achieved
        let nextMilestone = null;
        for (let i = 0; i < MILESTONES.length; i++) {
            if (bookingCount < MILESTONES[i]) {
                nextMilestone = MILESTONES[i];
                break;
            }
        }
        const nextMilestonePoints = nextMilestone ? ({1:100,5:150,10:200,20:250,50:500}[nextMilestone]) : null;
        const allMilestonesAchieved = bookingCount >= MILESTONES[MILESTONES.length - 1];

        res.status(200).json({
            name: user?.customerName || user?.username || user?.email || 'Loyalty Member',
            customerName: user?.customerName,
            username: user?.username,
            email: user?.email,
            status: loyalty.tier,
            points: loyalty.pointsBalance, // This is the current points balance
            pointsBalance: loyalty.pointsBalance, // Also return as pointsBalance for clarity
            lifetimePoints: loyalty.lifetimePoints,
            rewards: [], // Fill as needed
            pointsToBronze,
            isBirthday,
            birthdayClaimed,
            signupGiftClaimed,
            bookingCount,
            milestonesClaimed,
            nextMilestone,
            nextMilestonePoints,
            allMilestonesAchieved
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const previewPoints = (req, res) => {
    try {
        const { eligibleSpend, tier = 'Bronze', baseRate } = req.body;

        const points = calculateEarnedPoints({ eligibleSpend, tier, baseRate });
        if (!points || points < 1) {
            return res.status(400).json({
                message: 'Unable to calculate points. Check eligibleSpend/baseRate.',
            });
        }

        return res.status(200).json({
            data: {
                eligibleSpend: normalizeMoney(eligibleSpend),
                tier,
                multiplier: getTierMultiplier(tier),
                baseRate: Number(baseRate) > 0 ? Number(baseRate) : DEFAULT_BASE_RATE,
                points,
                formula: 'floor(eligibleSpend * baseRate * tierMultiplier)',
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
