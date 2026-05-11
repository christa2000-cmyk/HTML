
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Unique referral code for this user
    referralCode: {
        type: String,
        unique: true,
        sparse: true,
        default: function() {
            // Generate a simple code if not set (e.g. 8-char base36)
            return Math.random().toString(36).substr(2, 8).toUpperCase();
        }
    },
    // Total completed bookings for milestone tracking
    bookingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Array of milestone numbers already rewarded (e.g., [1,5,10])
    milestonesClaimed: {
        type: [Number],
        default: []
    },
    // Total points earned by the user (milestones, rewards, etc.)
    points: {
        type: Number,
        default: 0,
        min: 0
    },
    // The code of the user who referred this user
    referredBy: {
        type: String,
        default: null,
    },
    dateOfBirth: {
        type: Date,
        default: null,
    },
    username: {
        type: String,
        required: [true, 'Name is required'],
        unique: true,
        trim: true,
        minlength: [8, 'Name must be at least 8 characters'],
        maxlength: [30, 'Name must be at most 30 characters'],
    },
    customerName: {
        type: String,
        trim: true,
        default: '',
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
    },


        // Email confirmation fields
        isEmailConfirmed: {
            type: Boolean,
            default: false,
        },
        emailConfirmationToken: {
            type: String,
            default: undefined,
        },
        emailConfirmationExpires: {
            type: Date,
            default: undefined,
        },

        // Tracks which program(s) this user is enrolled in
        accountType: {
            type: String,
            enum: ['standard_premium', 'premium_elite', 'loyalty', 'premium_plus', 'elite'],
            default: 'standard_premium',
        },

        // Convenience references — populated when user joins a programme
        membershipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EliteMember',
            default: null,
        },

        loyaltyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Loyalty',
            default: null,
        },

        loginTokenId: {
            type: String,
            default: null,
        },

        loginTokenExpiresAt: {
            type: Date,
            default: null,
        },

        loyaltyUnlockId: {
            type: String,
            default: null,
        },

        loyaltyUnlockExpiresAt: {
            type: Date,
            default: null,
        },

        eliteUnlockId: {
            type: String,
            default: null,
        },

        eliteUnlockExpiresAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }   // adds createdAt & updatedAt automatically
);

const User = mongoose.model('User', userSchema);

export default User;