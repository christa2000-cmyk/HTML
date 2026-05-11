import User from '../models/user.model.js';

// Milestone map: bookingCount => bonus points
const MILESTONES = {
  1: 100,
  5: 150,
  10: 200,
  20: 250,
  50: 500
};

// POST /api/V1/webhook/booking-completed
export async function bookingCompletedWebhook(req, res) {
  try {
    const { userId, email, username } = req.body;
    if (!userId && !email && !username) {
      return res.status(400).json({ error: 'userId, email, or username required' });
    }
    // Find user by id, email, or username
    const user = await User.findOne(
      userId ? { _id: userId } : email ? { email } : { username }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.bookingCount = (user.bookingCount || 0) + 1;
    let milestoneAwarded = null;
    if (MILESTONES[user.bookingCount] && !user.milestonesClaimed.includes(user.bookingCount)) {
      // Award milestone bonus
      user.points = (user.points || 0) + MILESTONES[user.bookingCount];
      user.milestonesClaimed.push(user.bookingCount);
      milestoneAwarded = {
        bookingCount: user.bookingCount,
        points: MILESTONES[user.bookingCount]
      };
    }
    await user.save();
    res.json({ ok: true, bookingCount: user.bookingCount, milestoneAwarded });
  } catch (err) {
    console.error('[Webhook] Booking completed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
