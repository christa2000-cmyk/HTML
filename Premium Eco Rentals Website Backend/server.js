// Enhanced error logging for uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Global error logging for diagnostics (must be at the very top)
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection:', err);
});
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import connectToMongoDB from './config/db.js';
import { PORT, NODE_ENV } from './config/env.js';

import userRouter from './routes/user.routes.js';
import eliteRouter from './routes/elite.routes.js';
import loyaltyRouter from './routes/loyalty.routes.js';
import joinRequestRouter from './routes/joinRequest.routes.js';
import referralRouter from './routes/referral.routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NOTIF_FILE = join(__dirname, 'notifications.json');

// ── Persistent notification state (survives server restarts) ─────────────────
function loadNotifications() {
    try {
        if (existsSync(NOTIF_FILE)) return JSON.parse(readFileSync(NOTIF_FILE, 'utf8'));
    } catch (e) { /* corrupt file — start fresh */ }
    return { customerLandedAt: null, customerCurbsideAt: null };
}
function saveNotifications() {
    try { writeFileSync(NOTIF_FILE, JSON.stringify({ customerLandedAt, customerCurbsideAt })); }
    catch (e) { console.error('Could not save notifications.json:', e.message); }
}

let { customerLandedAt, customerCurbsideAt } = loadNotifications();
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500'
    ],
    credentials: true
}));
app.use(express.json());

// ── Driver Live Location ─────────────────────────────────────────────────────
// Default parked position: Ant's Nest, Maurice Bishop Memorial Hwy
let driverLocation = {
    lat: 12.007629,
    lng: -61.785719,
    active: false,        // true = driver is actively broadcasting
    updatedAt: null
};

const DRIVER_SECRET = 'PER-DRIVER-2026'; // driver must include this in X-Driver-Token header

// Driver broadcasts their GPS position (called from driver.html every 5 s)
app.post('/api/V1/driver-location', (req, res) => {
    const token = req.headers['x-driver-token'];
    if (token !== DRIVER_SECRET) {
        return res.status(401).json({ error: 'Unauthorised' });
    }
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    driverLocation = { lat: parseFloat(lat), lng: parseFloat(lng), active: true, updatedAt: new Date().toISOString() };
    return res.json({ ok: true });
});

// Driver stops sharing (called when driver.html page is closed / stop pressed)
app.delete('/api/V1/driver-location', (req, res) => {
    const token = req.headers['x-driver-token'];
    if (token !== DRIVER_SECRET) return res.status(401).json({ error: 'Unauthorised' });
    driverLocation.active = false;
    return res.json({ ok: true });
});

// Customer map polls this to get current driver position
app.get('/api/V1/driver-location', (req, res) => {
    res.json(driverLocation);
});
// ─────────────────────────────────────────────────────────────────────────────

// ── Customer "I've Landed" notification ──────────────────────────────────────
// Customer taps "I've Landed" — stores timestamp
app.post('/api/V1/customer-landed', (req, res) => {
    customerLandedAt = new Date().toISOString();
    saveNotifications();
    res.json({ ok: true, landedAt: customerLandedAt });
});

// Driver polls this to check for a landed notification (requires driver token)
app.get('/api/V1/customer-landed', (req, res) => {
    const token = req.headers['x-driver-token'];
    if (token !== DRIVER_SECRET) return res.status(401).json({ error: 'Unauthorised' });
    res.json({ landed: customerLandedAt !== null, landedAt: customerLandedAt });
});

// Driver acknowledges notification — clears the flag
app.delete('/api/V1/customer-landed', (req, res) => {
    const token = req.headers['x-driver-token'];
    if (token !== DRIVER_SECRET) return res.status(401).json({ error: 'Unauthorised' });
    customerLandedAt = null;
    saveNotifications();
    res.json({ ok: true });
});
// ─────────────────────────────────────────────────────────────────────────────

// ── Customer "I'm at Curbside" notification ──────────────────────────────────
app.post('/api/V1/customer-curbside', (req, res) => {
    customerCurbsideAt = new Date().toISOString();
    saveNotifications();
    res.json({ ok: true, curbsideAt: customerCurbsideAt });
});

app.get('/api/V1/customer-curbside', (req, res) => {
    const token = req.headers['x-driver-token'];
    if (token !== DRIVER_SECRET) return res.status(401).json({ error: 'Unauthorised' });
    res.json({ waiting: customerCurbsideAt !== null, curbsideAt: customerCurbsideAt });
});

app.delete('/api/V1/customer-curbside', (req, res) => {
    const token = req.headers['x-driver-token'];
    if (token !== DRIVER_SECRET) return res.status(401).json({ error: 'Unauthorised' });
    customerCurbsideAt = null;
    saveNotifications();
    res.json({ ok: true });
});
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/V1/health', (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(200).json({ status: 'ok', env: NODE_ENV, dbConnected });
});

app.use('/api/V1/users', userRouter);
app.use('/api/V1/elite', eliteRouter);
app.use('/api/V1/loyalty', loyaltyRouter);
app.use('/api/V1/requests', joinRequestRouter);
app.use('/api/V1/referral', referralRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const connectWithRetry = async () => {
    try {
        await connectToMongoDB();
    } catch (error) {
        console.error('Failed to connect to DB. Retrying in 15s...', error?.message || error);
        setTimeout(connectWithRetry, 15000);
    }
};

connectWithRetry();
