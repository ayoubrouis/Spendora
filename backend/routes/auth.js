const router = require("express").Router();
const { register, login, currentUser, logout, verifyEmail, resendVerification } = require("../controllers/auth");
const requireAuth = require("../middleware/requireAuth");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/resend-verification", resendVerification);
router.get("/auth/me", requireAuth, currentUser);
router.post("/auth/logout", requireAuth, logout);

module.exports = router;
