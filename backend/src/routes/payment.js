const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/plans', paymentController.getSubscriptionPlans);

// Protected routes
router.use(protect);

// Subscription management
router.post('/create-subscription', paymentController.createSubscription);
router.post('/update-subscription', paymentController.updateSubscription);
router.post('/cancel-subscription', paymentController.cancelSubscription);
router.get('/billing-history', paymentController.getBillingHistory);

// One-time payments
router.post('/pay-per-report', paymentController.payPerReport);

// Customer portal
router.post('/create-portal-session', paymentController.createPortalSession);

module.exports = router; 