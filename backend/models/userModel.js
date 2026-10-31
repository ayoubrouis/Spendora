const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true,
            select: false
        },
        tokenHash: {
            type: String,
            default: null,
            select: false
        },
        emailVerified: {
            // Defaults to true so accounts created before verification existed
            // keep working. New signups explicitly set it to false.
            type: Boolean,
            default: true
        },
        verificationTokenHash: {
            type: String,
            default: null,
            select: false
        },
        verificationExpiresAt: {
            type: Date,
            default: null
        },
        passwordResetTokenHash: {
            type: String,
            default: null,
            select: false
        },
        passwordResetExpiresAt: {
            type: Date,
            default: null
        },
        displayName: {
            type: String,
            default: "",
            trim: true,
            maxlength: 40
        },
        avatarUrl: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2048
        }
    },
    { timestamps: true }
);

// MongoDB's TTL monitor deletes any user whose verificationExpiresAt is a past
// date. Verified users have that field set to null, and null is ignored by TTL,
// so only never-verified accounts get removed (about 24 hours after signup).
userSchema.index({ verificationExpiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("User", userSchema);
