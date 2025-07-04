const express = require('express');
const analysisController = require('../controllers/analysisController');
const { protect, optionalAuth, requireFeature } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.get('/public/:slug', analysisController.getPublicAnalysis);

// Routes that work with or without authentication
router.use(optionalAuth);

// Analysis calculation (free for all users)
router.post('/calculate', analysisController.calculateAnalysis);

// Protected routes
router.use(protect);

// CRUD operations for saved analyses
router.route('/')
  .get(analysisController.getMyAnalyses)
  .post(requireFeature('basic_analysis'), analysisController.createAnalysis);

router.route('/:id')
  .get(analysisController.getAnalysis)
  .patch(analysisController.updateAnalysis)
  .delete(analysisController.deleteAnalysis);

// Analysis management
router.post('/:id/clone', analysisController.cloneAnalysis);
router.patch('/:id/bookmark', analysisController.toggleBookmark);
router.patch('/:id/share', analysisController.shareAnalysis);

// Bulk operations
router.post('/bulk-delete', analysisController.bulkDeleteAnalyses);
router.get('/export', analysisController.exportAnalyses);

// Portfolio views
router.get('/portfolio/summary', requireFeature('portfolio_tracking'), analysisController.getPortfolioSummary);
router.get('/portfolio/performance', requireFeature('portfolio_tracking'), analysisController.getPortfolioPerformance);

module.exports = router; 