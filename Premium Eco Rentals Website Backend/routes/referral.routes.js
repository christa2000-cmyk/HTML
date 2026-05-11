import { Router } from 'express';
import { confirmReferralBooking, getReferralStats } from '../controllers/referral.controller.js';

const referralRouter = Router();

// Admin endpoint to confirm a referral booking
referralRouter.post('/confirm-booking', confirmReferralBooking);

// Endpoint to get referral stats for a user (dashboard)
referralRouter.get('/stats', getReferralStats);

export default referralRouter;
