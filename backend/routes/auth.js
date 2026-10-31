const router = require("express").Router();
const { register, login, currentUser, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, updateProfile } = require("../controllers/auth");
const requireAuth = require("../middleware/requireAuth");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/resend-verification", resendVerification);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
router.get("/auth/me", requireAuth, currentUser);
router.put("/auth/me", requireAuth, updateProfile);
router.post("/auth/logout", requireAuth, logout);

module.exports = router;
