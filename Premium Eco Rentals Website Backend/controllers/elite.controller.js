import EliteMember from '../models/elite.model.js';
import Loyalty from '../models/loyalty.model.js';
import User from '../models/user.model.js';

export const joinElite = async (req, res) => {
    try {
        const requestedUserId = req.body.userId;
        const authenticatedUserId = req.user?.userId;
        const userId = authenticatedUserId || requestedUserId;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        if (authenticatedUserId && requestedUserId && authenticatedUserId !== requestedUserId) {
            return res.status(403).json({ message: 'You can only enroll your own account in elite membership' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1) Ensure Elite membership exists
        let eliteMember = await EliteMember.findOne({ userId });
        if (!eliteMember) {
            eliteMember = await EliteMember.create({
                userId,
                plan: 'Premium Elite Experience',
                isFree: true,
                status: 'active',
            });
        }

        // 2) Ensure Loyalty account exists (auto access for elite users)
        let loyalty = await Loyalty.findOne({ userId });
        if (!loyalty) {
            loyalty = await Loyalty.create({ userId });
        }

        // 3) Link user to both records
        user.membershipId = eliteMember._id;
        user.loyaltyId = loyalty._id;

        // Elite signup automatically includes loyalty access
        user.accountType = 'elite';

        await user.save();

        return res.status(200).json({
            message: 'Elite signup successful. Loyalty access has been enabled automatically.',
            data: {
                userId: user._id,
                accountType: user.accountType,
                membershipId: user.membershipId,
                loyaltyId: user.loyaltyId,
                rewardsEnabled: true,
                roadMilesEnabled: true,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
