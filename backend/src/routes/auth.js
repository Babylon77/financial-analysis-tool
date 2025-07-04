const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Password reset
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Protected routes
router.use(protect); // All routes after this middleware are protected

// Password management
router.patch('/update-password', authController.updatePassword);

// Token refresh
router.post('/refresh-token', authController.refreshToken);

module.exports = router; 