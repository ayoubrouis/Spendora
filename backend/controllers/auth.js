const { promisify } = require("node:util");
const {
    createHash,
    randomBytes,
    scrypt: scryptCallback,
    timingSafeEqual
} = require("node:crypto");
const User = require("../models/userModel");
const { isProduction, sendVerificationEmail } = require("../utils/mailer");

const scrypt = promisify(scryptCallback);

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function derivePassword(password, salt) {
    return scrypt(password, salt, 64);
}

function hashToken(token) {
    return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
    const derivedKey = await derivePassword(password, salt);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function passwordMatches(password, storedHash) {
    const [salt, key] = storedHash.split(":");
    const expected = Buffer.from(key, "hex");
    const actual = await derivePassword(password, salt);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function validCredentials(email, password) {
    return (
        typeof email === "string" &&
        EMAIL_PATTERN.test(email.trim()) &&
        typeof password === "string" &&
        password.length >= 8 &&
        password.length <= 128
    );
}

function issueToken(user) {
    const token = randomBytes(32).toString("hex");
    user.tokenHash = hashToken(token);
    return token;
}

function issueVerification(user) {
    const token = randomBytes(32).toString("hex");
    user.verificationTokenHash = hashToken(token);
    user.verificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    return token;
}

function publicUser(user) {
    return { email: user.email };
}

exports.register = async (req, res) => {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const { password } = body;

    if (!validCredentials(email, password)) {
        return res.status(400).json({
            error: "Enter a valid email and a password between 8 and 128 characters."
        });
    }

    try {
        const user = new User({
            email,
            passwordHash: await hashPassword(password),
            emailVerified: false
        });
        const verificationToken = issueVerification(user);
        await user.save();
        const verificationUrl = await sendVerificationEmail(email, verificationToken);

        return res.status(201).json({
            message: "Check your inbox to verify your account.",
            email,
            ...(isProduction ? {} : { verificationUrl })
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }
        console.error("Account registration failed:", error.message);
        return res.status(500).json({ error: "Could not create the account." });
    }
};

exports.login = async (req, res) => {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const { password } = body;

    if (!EMAIL_PATTERN.test(email) || typeof password !== "string" || password.length > 128) {
        return res.status(400).json({ error: "Enter your email and password." });
    }

    try {
        const user = await User.findOne({ email }).select("+passwordHash");
        if (!user || !(await passwordMatches(password, user.passwordHash))) {
            return res.status(401).json({ error: "Email or password is incorrect." });
        }

        // Only checked after the password is proven correct, so this response
        // doesn't reveal account state to someone guessing emails.
        if (user.emailVerified === false) {
            return res.status(403).json({
                error: "Verify your email before logging in.",
                code: "email-not-verified"
            });
        }

        const token = issueToken(user);
        await user.save();
        return res.status(200).json({ token, user: publicUser(user) });
    } catch (error) {
        console.error("Account login failed:", error.message);
        return res.status(500).json({ error: "Could not log in." });
    }
};

exports.verifyEmail = async (req, res) => {
    const body = req.body || {};
    const token = typeof body.token === "string" ? body.token : "";

    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({ error: "This verification link is not valid." });
    }

    try {
        const user = await User.findOne({
            verificationTokenHash: hashToken(token),
            verificationExpiresAt: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: "This link is invalid or has expired. Request a new one." });
        }

        user.emailVerified = true;
        user.verificationTokenHash = null;
        user.verificationExpiresAt = null;
        const sessionToken = issueToken(user);
        await user.save();

        return res.status(200).json({ token: sessionToken, user: publicUser(user) });
    } catch (error) {
        console.error("Email verification failed:", error.message);
        return res.status(500).json({ error: "Could not verify the email." });
    }
};

exports.resendVerification = async (req, res) => {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ error: "Enter a valid email address." });
    }

    try {
        const user = await User.findOne({ email });
        let verificationUrl;

        // Always answer the same way, whether or not the account exists, so
        // this endpoint can't be used to discover registered emails.
        if (user && user.emailVerified === false) {
            const verificationToken = issueVerification(user);
            await user.save();
            verificationUrl = await sendVerificationEmail(email, verificationToken);
        }

        return res.status(200).json({
            message: "If that account still needs verification, a new link has been sent.",
            ...(!isProduction && verificationUrl ? { verificationUrl } : {})
        });
    } catch (error) {
        console.error("Verification resend failed:", error.message);
        return res.status(500).json({ error: "Could not send the verification email." });
    }
};

exports.currentUser = (req, res) => {
    res.status(200).json({ user: publicUser(req.user) });
};

exports.logout = async (req, res) => {
    try {
        await User.updateOne({ _id: req.user._id }, { $set: { tokenHash: null } });
        return res.status(200).json({ message: "Logged out." });
    } catch (error) {
        console.error("Account logout failed:", error.message);
        return res.status(500).json({ error: "Could not log out." });
    }
};

exports.hashToken = hashToken;
