import mongoose from 'mongoose';

/**
 * Loyalty Model — Loyal Members Points Programme
 *
 * Tracks a member's points balance, tier status, and a full
 * transaction history so points can be audited at any time.
 */

// Sub-schema: individual point transactions (earn / redeem / expire)
const transactionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['earn', 'redeem', 'expire', 'bonus'],
            required: true,
        },

        points: {
            type: Number,
            required: true,
            min: [1, 'Transaction must involve at least 1 point'],
        },

        description: {
            type: String,
            trim: true,
            default: '',   // e.g. "Rental completed – 3 days", "Redeemed for upgrade"
        },

        date: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

// Tier thresholds (points-based)
// Bronze: 1500–2499 | Silver: 2500–4999 | Gold: 5000–9999 | Platinum: 10000+
// Below 1500: No Tier
const loyaltySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,   // one loyalty account per user
        },

        pointsBalance: {
            type: Number,
            default: 0,
            min: [0, 'Points balance cannot be negative'],
        },

        lifetimePoints: {
            type: Number,
            default: 0,   // never decremented — used for tier calculation
        },

        tier: {
            type: String,
            enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
            default: 'Bronze',
        },

        transactions: {
            type: [transactionSchema],
            default: [],
        },

        // Optional: member's preferred reward category
        rewardPreference: {
            type: String,
            enum: ['discounts', 'free_days', 'upgrades', 'experiences'],
            default: 'discounts',
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Auto-update tier based on lifetimePoints before saving
loyaltySchema.pre('save', async function () {
    const pts = this.lifetimePoints;
    if (pts >= 10000) {
        this.tier = 'Platinum';
    } else if (pts >= 5000) {
        this.tier = 'Gold';
    } else if (pts >= 2500) {
        this.tier = 'Silver';
    } else if (pts >= 1500) {
        this.tier = 'Bronze';
    } else {
        this.tier = undefined;
    }
});

const Loyalty = mongoose.model('Loyalty', loyaltySchema);

export default Loyalty;
