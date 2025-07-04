const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Stripe webhook (requires raw body)
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.stripeWebhook);

// Other webhook endpoints can be added here
// router.post('/zillow', webhookController.zillowWebhook);
// router.post('/airdna', webhookController.airdnaWebhook);

module.exports = router; 