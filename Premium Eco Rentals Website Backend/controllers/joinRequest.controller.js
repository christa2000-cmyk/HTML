import nodemailer from 'nodemailer';
import crypto from 'crypto';
import User from '../models/user.model.js';
import {
    NODE_ENV,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    JOIN_REQUEST_RECEIVER,
} from '../config/env.js';

const resolveBoolean = (value) => `${value}`.toLowerCase() === 'true';

const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const ACCESS_ID_TTL_MS = 24 * 60 * 60 * 1000;

const createTransporter = () => {
    const host = SMTP_HOST || 'smtp.gmail.com';
    const port = Number(SMTP_PORT || 465);
    const secure = SMTP_SECURE === undefined
        ? port === 465
        : resolveBoolean(SMTP_SECURE);

    if (!SMTP_USER || !SMTP_PASS) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: !secure,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: NODE_ENV === 'development' ? false : true,
        },
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
};

export const sendJoinRequestEmail = async (req, res) => {
    try {
        const { program, username, userEmail, accountType } = req.body;
        console.log('Received join request:', { program, username, userEmail, accountType });

        if (!program || !userEmail) {
            console.log('Missing program or userEmail');
            return res.status(400).json({ message: 'program and userEmail are required' });
        }

        const normalizedProgram = String(program).trim();
        if (!['Loyalty', 'Elite'].includes(normalizedProgram)) {
            console.log('Invalid program:', normalizedProgram);
            return res.status(400).json({ message: 'program must be either Loyalty or Elite' });
        }

        const transporter = createTransporter();
        if (!transporter) {
            const missing = [];
            if (!SMTP_USER) missing.push('SMTP_USER');
            if (!SMTP_PASS) missing.push('SMTP_PASS');
            console.log('Email service not configured. Missing:', missing);
            return res.status(500).json({
                message: `Email service is not configured. Missing: ${missing.join(', ')}. Set these in .env.development.local`,
            });
        }

        const receiver = JOIN_REQUEST_RECEIVER || 'premiumecorentals2023@gmail.com';
        const sender = SMTP_FROM || SMTP_USER;

        const loginTokenId = generateId('LOGIN');
        const programUnlockId = generateId(normalizedProgram.toUpperCase());
        const expiresAt = new Date(Date.now() + ACCESS_ID_TTL_MS);

        const userLookup = {};
        if (username) {
            userLookup.username = username;
        }
        if (userEmail) {
            userLookup.email = userEmail.toLowerCase();
        }

        const user = await User.findOne(userLookup);
        if (!user) {
            console.log('User not found for join request:', userLookup);
            return res.status(404).json({ message: 'User not found for join request' });
        }

        // Block only if requesting a program the user already has
        if (
            (normalizedProgram === 'Loyalty' && user.accountType === 'loyalty') ||
            (normalizedProgram === 'Elite' && user.accountType === 'elite')
        ) {
            console.log('User already has this account type:', user.accountType);
            return res.status(400).json({
                message: `You already have a ${user.accountType} account. Use the sign in flow to access your ${user.accountType} membership.`,
            });
        }
        // Allow loyalty users to request upgrade to Elite

        user.loginTokenId = loginTokenId;
        user.loginTokenExpiresAt = expiresAt;
        if (normalizedProgram === 'Loyalty') {
            user.loyaltyUnlockId = programUnlockId;
            user.loyaltyUnlockExpiresAt = expiresAt;
        } else {
            user.eliteUnlockId = programUnlockId;
            user.eliteUnlockExpiresAt = expiresAt;
        }
        await user.save();

        const subject = `Join ${normalizedProgram} Request`;
        const text = [
            'Hello Premium Eco Rentals Team,',
            '',
            `Please process this join request for ${normalizedProgram}.`,
            '',
            `Username: ${username || 'Not provided'}`,
            `Email: ${userEmail}`,
            `Current account type: ${accountType || 'standard_premium'}`,
            '',
            `The customer is requesting to join ${normalizedProgram}.`,
            '',
            'Generated Access IDs:',
            `Login Token ID: ${loginTokenId}`,
            `${normalizedProgram} Unlock ID: ${programUnlockId}`,
            `Expires At (24h): ${expiresAt.toISOString()}`,
        ].join('\n');

        console.log('Attempting to send email to', receiver, 'from', sender);
        try {
            await transporter.sendMail({
                from: sender,
                to: receiver,
                replyTo: userEmail,
                subject,
                text,
            });
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            return res.status(500).json({ message: 'Failed to send email', details: emailError.message });
        }

        return res.status(200).json({
            message: `${normalizedProgram} join request email sent successfully`,
        });
    } catch (error) {
        const rawMessage = error?.message || 'Email delivery failed';
        const normalizedMessage = String(rawMessage).toLowerCase();

        if (normalizedMessage.includes('ssl') || normalizedMessage.includes('tls')) {
            console.error('TLS/SSL error:', rawMessage);
            return res.status(502).json({
                message: 'SMTP TLS handshake failed. Verify SMTP_HOST, SMTP_PORT, and SMTP_SECURE (465=true, 587=false) and ensure the mail provider supports TLS 1.2+.',
                details: rawMessage,
            });
        }
        console.error('General error:', rawMessage);
        return res.status(500).json({ message: rawMessage });
    }
};
