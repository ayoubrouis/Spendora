const User = require("../models/userModel");
const { hashToken } = require("../controllers/auth");

module.exports = async (req, res, next) => {
    const authorization = req.get("authorization") || "";
    const match = authorization.match(/^Bearer ([a-f0-9]{64})$/i);

    if (!match) {
        return res.status(401).json({ error: "Please log in to continue." });
    }

    try {
        const user = await User.findOne({ tokenHash: hashToken(match[1]) }).select("_id email");
        if (!user) {
            return res.status(401).json({ error: "Your session has expired. Please log in again." });
        }

        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};
