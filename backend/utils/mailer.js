const { Resend } = require("resend");

const FRONTEND_URL = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
const isProduction = process.env.NODE_ENV === "production";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function buildVerificationLink(token) {
    return `${FRONTEND_URL}/?verify=${token}`;
}

function buildPasswordResetLink(token) {
    return `${FRONTEND_URL}/?reset=${token}`;
}

async function sendVerificationEmail(email, token) {
    const link = buildVerificationLink(token);

    if (!resend) {
        console.log(`[auth] Verification link for ${email}: ${link}`);
        return link;
    }

    const { error } = await resend.emails.send({
        from: "Spendora <onboarding@resend.dev>",
        to: email,
        subject: "Verify Your Email Address",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #202a25;">
                <h2 style="margin: 0 0 12px;">Welcome to Spendora</h2>
                <p style="margin: 0 0 20px; line-height: 1.5;">Please verify your email address to activate your account.</p>
                <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #32735b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700;">Verify Email</a>
                <p style="margin: 20px 0 0; font-size: 13px; color: #727d76; line-height: 1.5;">If the button doesn’t work, copy and paste this link into your browser:<br>${link}</p>
            </div>
        `,
    });

    if (error) {
        throw new Error(error.message);
    }

    return link;
}

async function sendPasswordResetEmail(email, token) {
    const link = buildPasswordResetLink(token);

    if (!resend) {
        console.log(`[auth] Password reset link for ${email}: ${link} (expires in 30 minutes)`);
        return link;
    }

    const { error } = await resend.emails.send({
        from: "Spendora <onboarding@resend.dev>",
        to: email,
        subject: "Reset Your Spendora Password",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #202a25;">
                <h2 style="margin: 0 0 12px;">Reset your password</h2>
                <p style="margin: 0 0 20px; line-height: 1.5;">We received a request to reset your Spendora password. This link expires in 30 minutes.</p>
                <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #32735b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700;">Reset Password</a>
                <p style="margin: 20px 0 0; font-size: 13px; color: #727d76; line-height: 1.5;">If you didn’t request this, you can ignore this email.<br>If the button doesn’t work, copy and paste this link:<br>${link}</p>
            </div>
        `,
    });

    if (error) {
        throw new Error(error.message);
    }

    return link;
}

module.exports = { buildVerificationLink, buildPasswordResetLink, isProduction, sendVerificationEmail, sendPasswordResetEmail };
