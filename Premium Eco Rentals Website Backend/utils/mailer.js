export const sendMilestoneEmail = async (to, username, milestone, points) => {
    const mailOptions = {
        from: `Premium Eco Rentals <${process.env.EMAIL_USER}>`,
        to,
        subject: `🎉 Milestone Achieved: ${milestone} Bookings!`,
        html: `
            <h2>Congratulations, ${username}!</h2>
            <p>You've reached a new booking milestone: <strong>${milestone} bookings</strong>!</p>
            <p>As a reward, <strong>${points} points</strong> have been added to your loyalty account.</p>
            <p>Thank you for being a valued member of Premium Eco Rentals.</p>
            <p style="margin-top:2em;font-size:0.95em;color:#888;">No action is needed—your points have already been credited.</p>
        `,
    };
    await transporter.sendMail(mailOptions);
};
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendConfirmationEmail = async (to, username, confirmationLink) => {
    const mailOptions = {
        from: `Premium Eco Rentals <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Confirm your Loyalty Program Signup',
        html: `
            <h2>Welcome to the Loyalty Program, ${username}!</h2>
            <p>Thank you for signing up. Please confirm your email address by clicking the link below:</p>
            <a href="${confirmationLink}" style="display:inline-block;padding:1em 2em;background:#1976d2;color:#fff;border-radius:1em;text-decoration:none;font-weight:bold;">Confirm Email</a>
            <p>If you did not sign up, please ignore this email.</p>
        `,
    };
    await transporter.sendMail(mailOptions);
};

export default transporter;
