const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.get("/me", authMiddleware, authController.me);
router.patch("/me", authMiddleware, authController.updateProfile);
router.get("/sessions", authMiddleware, authController.listSessions);
router.post("/change-password", authMiddleware, authController.changePassword);
router.post("/logout-current", authMiddleware, authController.logoutCurrentSession);
router.delete("/sessions/:sessionId", authMiddleware, authController.revokeSession);

module.exports = router;
