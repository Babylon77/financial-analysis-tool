const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// All AI routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/ai/chat
 * @desc    General chat with AI assistant
 * @access  Pro/Business subscribers
 */
router.post('/chat',
  [
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 2000 })
      .withMessage('Message must be less than 2000 characters'),
    body('conversationHistory')
      .optional()
      .isArray()
      .withMessage('Conversation history must be an array')
  ],
  handleValidationErrors,
  aiController.chat
);

/**
 * @route   POST /api/v1/ai/analyze
 * @desc    AI analysis of specific investment
 * @access  Pro/Business subscribers
 */
router.post('/analyze',
  [
    body('analysisId')
      .notEmpty()
      .withMessage('Analysis ID is required')
      .isMongoId()
      .withMessage('Invalid analysis ID format'),
    body('question')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Question must be less than 1000 characters')
  ],
  handleValidationErrors,
  aiController.analyzeInvestment
);

/**
 * @route   POST /api/v1/ai/planning
 * @desc    Financial planning advice
 * @access  Pro/Business subscribers
 */
router.post('/planning',
  [
    body('question')
      .notEmpty()
      .withMessage('Question is required')
      .isLength({ max: 1000 })
      .withMessage('Question must be less than 1000 characters'),
    body('goals')
      .optional()
      .isObject()
      .withMessage('Goals must be an object'),
    body('currentSituation')
      .optional()
      .isObject()
      .withMessage('Current situation must be an object')
  ],
  handleValidationErrors,
  aiController.planningAdvice
);

/**
 * @route   POST /api/v1/ai/market
 * @desc    Market insights and trends
 * @access  Pro/Business subscribers
 */
router.post('/market',
  [
    body('location')
      .notEmpty()
      .withMessage('Location is required')
      .isLength({ max: 100 })
      .withMessage('Location must be less than 100 characters'),
    body('propertyType')
      .optional()
      .isIn(['residential', 'commercial', 'multifamily', 'land'])
      .withMessage('Invalid property type'),
    body('question')
      .notEmpty()
      .withMessage('Question is required')
      .isLength({ max: 1000 })
      .withMessage('Question must be less than 1000 characters')
  ],
  handleValidationErrors,
  aiController.marketInsights
);

/**
 * @route   POST /api/v1/ai/explain
 * @desc    Explain calculation methodology
 * @access  All authenticated users (with limits for free tier)
 */
router.post('/explain',
  [
    body('calculationType')
      .notEmpty()
      .withMessage('Calculation type is required')
      .isIn(['roi', 'cashflow', 'appreciation', 'flip_analysis', 'rental_analysis', 'str_analysis', 'moda'])
      .withMessage('Invalid calculation type'),
    body('question')
      .notEmpty()
      .withMessage('Question is required')
      .isLength({ max: 500 })
      .withMessage('Question must be less than 500 characters'),
    body('inputData')
      .optional()
      .isObject()
      .withMessage('Input data must be an object')
  ],
  handleValidationErrors,
  aiController.explainCalculation
);

/**
 * @route   GET /api/v1/ai/status
 * @desc    Get AI service status and user access info
 * @access  All authenticated users
 */
router.get('/status', aiController.getStatus);

module.exports = router; 