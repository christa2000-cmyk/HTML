import express from 'express';
import { bookingCompletedWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

// POST /api/V1/webhook/booking-completed
router.post('/booking-completed', bookingCompletedWebhook);

export default router;
