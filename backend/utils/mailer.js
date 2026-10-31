const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const isProduction = process.env.NODE_ENV === "production";

function buildVerificationLink(token) {
    return `${FRONTEND_URL}/?verify=${token}`;
}

function buildPasswordResetLink(token) {
    return `${FRONTEND_URL}/?reset=${token}`;
}

// Sends the verification link. This is the single place to plug in a real
// email provider (SMTP, SES, Resend, ...). Until that exists, the link is
// printed to the server console so the flow can be completed locally.
async function sendVerificationEmail(email, token) {
    const link = buildVerificationLink(token);
    console.log(`[auth] Verification link for ${email}: ${link}`);
    return link;
}

async function sendPasswordResetEmail(email, token) {
    const link = buildPasswordResetLink(token);
    console.log(`[auth] Password reset link for ${email}: ${link} (expires in 30 minutes)`);
    return link;
}

module.exports = { buildVerificationLink, buildPasswordResetLink, isProduction, sendVerificationEmail, sendPasswordResetEmail };
