
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { sendConfirmationEmail } from '../utils/mailer.js';
import crypto from 'crypto';



export const createUser = async (req, res) => {
    try {
        const { username, email, password, referralCode } = req.body;
        // Accept referral code from query param as fallback
        const referredBy = referralCode || req.query.ref || null;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate email confirmation token
        const emailToken = crypto.randomBytes(32).toString('hex');
        const emailTokenExpires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            emailConfirmationToken: emailToken,
            emailConfirmationExpires: emailTokenExpires,
            isEmailConfirmed: false,
            referredBy: referredBy || undefined,
        });

        // Send confirmation email to user
        const confirmationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-email?token=${emailToken}&email=${encodeURIComponent(email)}`;
        await sendConfirmationEmail(email, username, confirmationLink);

        // Send referral notification to HQ if referredBy is present
        if (referredBy) {
            const { referralCode } = newUser;
            const hqMailOptions = {
                to: 'premiumecorentals2023@gmail.com',
                subject: 'New Referral Signup',
                html: `
                    <h2>New Referral Signup</h2>
                    <p><b>New User:</b> ${username} (${email})</p>
                    <p><b>Referral Code Used:</b> ${referredBy}</p>
                    <p><b>New User's Referral Code:</b> ${referralCode}</p>
                    <p>Signup Date: ${new Date().toLocaleString()}</p>
                `
            };
            const { default: transporter } = await import('../utils/mailer.js');
            await transporter.sendMail(hqMailOptions);
        }

        res.status(201).json({
            message: 'User created successfully. Please check your email to confirm your account.',
        });
    }
    catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ message: 'A user with that email already exists; Use a different email address for new user registration.' });
        }
        res.status(400).json({ message: error.message });
    }
};

// Email confirmation endpoint
export const confirmEmail = async (req, res) => {
    try {
        const { token, email } = req.query;
        const user = await User.findOne({ email, emailConfirmationToken: token, emailConfirmationExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired confirmation token.' });
        }
        user.isEmailConfirmed = true;
        user.emailConfirmationToken = undefined;
        user.emailConfirmationExpires = undefined;
        await user.save();
        res.status(200).json({ message: 'Email confirmed successfully. You can now sign in.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



export const getAllUsers = async (req, res) => {
    try {
        const { accountType } = req.query;

        // Build filter — if accountType query param is provided, filter by it
        const filter = accountType ? { accountType } : {};

        // Never return passwords to the client
        const users = await User.find(filter).select('-password');

        res.status(200).json({
            message: 'Users retrieved successfully',
            total: users.length,
            users,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const loginUser = async (req, res) => {
    try {
        const { username, password, loginToken, unlockId } = req.body;
        const now = new Date();

        if (!username || !password || !loginToken || !unlockId) {
            return res.status(400).json({ message: 'Username, password, login ID/token, and unlock ID are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        if (!user.loginTokenId || loginToken !== user.loginTokenId) {
            return res.status(401).json({ message: 'Invalid login ID/token' });
        }

        if (!user.loginTokenExpiresAt || now > user.loginTokenExpiresAt) {
            user.loginTokenId = null;
            user.loginTokenExpiresAt = null;
            user.loyaltyUnlockId = null;
            user.loyaltyUnlockExpiresAt = null;
            user.eliteUnlockId = null;
            user.eliteUnlockExpiresAt = null;
            await user.save();
            return res.status(401).json({ message: 'Login ID/token expired. Request a new join email.' });
        }

        const normalizedUnlockId = String(unlockId).trim().toUpperCase();
        let unlockedProgram = null;

        if (user.loyaltyUnlockId && normalizedUnlockId === user.loyaltyUnlockId) {
            if (!user.loyaltyUnlockExpiresAt || now > user.loyaltyUnlockExpiresAt) {
                user.loyaltyUnlockId = null;
                user.loyaltyUnlockExpiresAt = null;
                await user.save();
                return res.status(401).json({ message: 'Loyalty unlock ID expired. Request a new Loyalty join email.' });
            }
            user.accountType = user.accountType === 'elite' ? 'elite' : 'loyalty';
            user.loyaltyUnlockId = null;
            user.loyaltyUnlockExpiresAt = null;
            unlockedProgram = 'loyalty';
        } else if (user.eliteUnlockId && normalizedUnlockId === user.eliteUnlockId) {
            if (!user.eliteUnlockExpiresAt || now > user.eliteUnlockExpiresAt) {
                user.eliteUnlockId = null;
                user.eliteUnlockExpiresAt = null;
                await user.save();
                return res.status(401).json({ message: 'Elite unlock ID expired. Request a new Elite join email.' });
            }
            user.accountType = 'elite';
            user.eliteUnlockId = null;
            user.eliteUnlockExpiresAt = null;
            unlockedProgram = 'elite';
        } else {
            return res.status(401).json({ message: 'Invalid unlock ID' });
        }

        user.loginTokenId = null;
        user.loginTokenExpiresAt = null;
        await user.save();

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: `Login successful. ${unlockedProgram === 'elite' ? 'Elite' : 'Loyalty'} access activated.`,
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                accountType: user.accountType,
                membershipId: user.membershipId,
                loyaltyId: user.loyaltyId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const signinUser = async (req, res) => {
    try {
        const { email, password, program } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        let token = null;

        if (program) {
            const normalizedProgram = String(program).trim();

            if (!['Loyalty', 'Elite'].includes(normalizedProgram)) {
                return res.status(400).json({ message: 'program must be either Loyalty or Elite' });
            }

            const canUseProgram = normalizedProgram === 'Elite'
                ? user.accountType === 'elite' || user.accountType === 'premium_elite' || Boolean(user.membershipId)
                : user.accountType === 'loyalty'
                    || user.accountType === 'elite'
                    || user.accountType === 'premium_elite'
                    || Boolean(user.loyaltyId)
                    || Boolean(user.membershipId);

            if (!canUseProgram) {
                return res.status(403).json({ message: `This account is not enrolled in ${normalizedProgram}. Use Join ${normalizedProgram} if you are a new member.` });
            }

            token = jwt.sign(
                {
                    userId: user._id.toString(),
                    email: user.email,
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
        }

        return res.status(200).json({
            message: token ? `${program} member sign in successful` : 'Sign in successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                accountType: user.accountType,
                membershipId: user.membershipId,
                loyaltyId: user.loyaltyId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

