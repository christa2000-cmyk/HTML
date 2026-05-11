
import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
	earnPoints,
	previewPoints,
	getDashboard,
	claimSignupGift,
	getRecentActivity,
	claimBirthdayPoints,
	redeemFreeRentalDay
} from '../controllers/loyalty.controller.js';

const loyaltyRouter = Router();

// Recent activity endpoint
loyaltyRouter.get('/recent-activity', verifyToken, getRecentActivity);

// Birthday points claim endpoint
loyaltyRouter.post('/claim-birthday', verifyToken, claimBirthdayPoints);

loyaltyRouter.post('/claim-signup-gift', verifyToken, claimSignupGift);
loyaltyRouter.post('/earn', verifyToken, earnPoints);


// Redeem points for free rental day(s)
loyaltyRouter.post('/redeem', verifyToken, redeemFreeRentalDay);

loyaltyRouter.post('/preview', previewPoints);
loyaltyRouter.get('/dashboard', verifyToken, getDashboard);

export default loyaltyRouter;

