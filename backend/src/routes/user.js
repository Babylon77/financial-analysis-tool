const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Current user routes
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);

// User preferences
router.get('/preferences', userController.getPreferences);
router.patch('/preferences', userController.updatePreferences);

// Subscription management
router.get('/subscription', userController.getSubscription);
router.patch('/subscription', userController.updateSubscription);

// Usage statistics
router.get('/usage', userController.getUsage);

// Admin only routes
router.use(restrictTo('admin'));

router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router; 