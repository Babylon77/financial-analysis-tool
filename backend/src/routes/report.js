const express = require('express');
const reportController = require('../controllers/reportController');
const { protect, optionalAuth, requireFeature } = require('../middleware/auth');

const router = express.Router();

// Optional auth for pay-per-report
router.use(optionalAuth);

// Report generation
router.post('/generate', reportController.generateReport);
router.get('/download/:reportId', reportController.downloadReport);

// Protected routes
router.use(protect);

// Report management for Pro+ users
router.use(requireFeature('unlimited_reports'));

router.get('/', reportController.getMyReports);
router.get('/:id', reportController.getReport);
router.delete('/:id', reportController.deleteReport);

// Custom report templates (Business tier)
router.post('/templates', requireFeature('white_label'), reportController.createTemplate);
router.get('/templates', requireFeature('white_label'), reportController.getTemplates);

module.exports = router; 