import mongoose from 'mongoose';

/**
 * Membership Model — Premium Elite Experience
 *
 * Created when a user selects the "Premium Elite Experience" plan.
 * Membership is automatically FREE for that plan; the isFree flag
 * is set by the service/controller, not by the client.
 */
const eliteMemberSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,   // one membership record per user
        },

        plan: {
            type: String,
            enum: ['Premium Elite Experience'],   // extend this enum if more plans are added
            required: [true, 'Plan is required'],
        },

        // Always true for Premium Elite Experience — enforced server-side
        isFree: {
            type: Boolean,
            default: true,
        },

        status: {
            type: String,
            enum: ['active', 'suspended', 'cancelled'],
            default: 'active',
        },

        startDate: {
            type: Date,
            default: Date.now,
        },

        // Optional: set an expiry if membership has a term (e.g., 1 year)
        endDate: {
            type: Date,
            default: null,
        },

        // Benefits unlocked with this membership
        benefits: {
            type: [String],
            default: [
                'Includes membership',
                'All features of Premium Plus along with:',
                'Complimentary membership to our exclusive loyalty program',
                'Ability to earn loyalty points on all rentals, road miles, earn rewards',
                'Access to exclusive elite-only promotions and discounts',
                'Early access to new vehicle models',
                'Personalized service and support',
                'VIP event invitations',
                'Exclusive access to premium events',
                'Priority customer support',
                'Dedicated concierge support',                
                'Priority booking',
                'Exclusive vehicle access',
                'Complimentary upgrades',
                'Special offers and discounts',
                'Enhanced loyalty rewards',
                'Exclusive access to new features and services',
                ],
        },
    },
    { timestamps: true }
);

const EliteMember = mongoose.model('EliteMember', eliteMemberSchema);

export default EliteMember;
