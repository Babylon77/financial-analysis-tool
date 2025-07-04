const aiService = require('../services/aiService');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const Analysis = require('../models/Analysis');

/**
 * General chat with AI assistant
 */
exports.chat = catchAsync(async (req, res, next) => {
  const { message, conversationHistory = [] } = req.body;
  const userId = req.user.id;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return next(new AppError('Message is required', 400));
  }

  if (message.length > 2000) {
    return next(new AppError('Message too long. Please keep messages under 2000 characters.', 400));
  }

  // Check if user has access to AI features
  if (!req.user.hasFeatureAccess('llm_assistant')) {
    return next(new AppError('AI assistant is only available for Pro and Business subscribers', 403));
  }

  // Check user's AI usage limits
  const usageCheck = await req.user.checkUsageLimit('ai_requests');
  if (!usageCheck.allowed) {
    return next(new AppError(`AI usage limit exceeded. Limit: ${usageCheck.limit} requests per ${usageCheck.period}`, 429));
  }

  try {
    // Get user context for personalized responses
    const userProfile = {
      subscription: req.user.subscription.tier,
      preferences: req.user.preferences,
      experience: req.user.profile.experience || 'beginner'
    };

    // Generate AI response
    const aiResponse = await aiService.generateResponse(message, {
      userProfile,
      conversationHistory
    });

    // Track usage
    await req.user.trackUsage('ai_requests', 1);

    res.status(200).json({
      status: 'success',
      data: {
        response: aiResponse.response,
        usage: {
          tokensUsed: aiResponse.usage.total_tokens,
          model: aiResponse.model
        },
        userUsage: await req.user.getUsageStats('ai_requests')
      }
    });

  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    return next(new AppError('Failed to generate AI response', 500));
  }
});

/**
 * AI analysis of a specific property/investment
 */
exports.analyzeInvestment = catchAsync(async (req, res, next) => {
  const { analysisId, question } = req.body;
  const userId = req.user.id;

  if (!analysisId) {
    return next(new AppError('Analysis ID is required', 400));
  }

  // Check if user has access to AI features
  if (!req.user.hasFeatureAccess('llm_assistant')) {
    return next(new AppError('AI assistant is only available for Pro and Business subscribers', 403));
  }

  // Check usage limits
  const usageCheck = await req.user.checkUsageLimit('ai_requests');
  if (!usageCheck.allowed) {
    return next(new AppError(`AI usage limit exceeded. Limit: ${usageCheck.limit} requests per ${usageCheck.period}`, 429));
  }

  // Get the analysis
  const analysis = await Analysis.findOne({ _id: analysisId, userId });
  if (!analysis) {
    return next(new AppError('Analysis not found', 404));
  }

  try {
    // Generate AI insights
    const aiResponse = await aiService.analyzeInvestment(analysis.toObject(), question);

    // Track usage
    await req.user.trackUsage('ai_requests', 1);

    res.status(200).json({
      status: 'success',
      data: {
        response: aiResponse.response,
        analysisId,
        usage: {
          tokensUsed: aiResponse.usage.total_tokens,
          model: aiResponse.model
        }
      }
    });

  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    return next(new AppError('Failed to analyze investment', 500));
  }
});

/**
 * Financial planning advice
 */
exports.planningAdvice = catchAsync(async (req, res, next) => {
  const { goals, currentSituation, question } = req.body;
  const userId = req.user.id;

  if (!question || typeof question !== 'string') {
    return next(new AppError('Question is required', 400));
  }

  // Check if user has access to AI features
  if (!req.user.hasFeatureAccess('llm_assistant')) {
    return next(new AppError('AI assistant is only available for Pro and Business subscribers', 403));
  }

  // Check usage limits
  const usageCheck = await req.user.checkUsageLimit('ai_requests');
  if (!usageCheck.allowed) {
    return next(new AppError(`AI usage limit exceeded. Limit: ${usageCheck.limit} requests per ${usageCheck.period}`, 429));
  }

  try {
    const aiResponse = await aiService.providePlanningAdvice(goals, currentSituation, question);

    // Track usage
    await req.user.trackUsage('ai_requests', 1);

    res.status(200).json({
      status: 'success',
      data: {
        response: aiResponse.response,
        usage: {
          tokensUsed: aiResponse.usage.total_tokens,
          model: aiResponse.model
        }
      }
    });

  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    return next(new AppError('Failed to provide planning advice', 500));
  }
});

/**
 * Market insights and trends
 */
exports.marketInsights = catchAsync(async (req, res, next) => {
  const { location, propertyType = 'residential', question } = req.body;
  const userId = req.user.id;

  if (!location || !question) {
    return next(new AppError('Location and question are required', 400));
  }

  // Check if user has access to AI features
  if (!req.user.hasFeatureAccess('llm_assistant')) {
    return next(new AppError('AI assistant is only available for Pro and Business subscribers', 403));
  }

  // Check usage limits
  const usageCheck = await req.user.checkUsageLimit('ai_requests');
  if (!usageCheck.allowed) {
    return next(new AppError(`AI usage limit exceeded. Limit: ${usageCheck.limit} requests per ${usageCheck.period}`, 429));
  }

  try {
    const aiResponse = await aiService.getMarketInsights(location, propertyType, question);

    // Track usage
    await req.user.trackUsage('ai_requests', 1);

    res.status(200).json({
      status: 'success',
      data: {
        response: aiResponse.response,
        location,
        propertyType,
        usage: {
          tokensUsed: aiResponse.usage.total_tokens,
          model: aiResponse.model
        }
      }
    });

  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    return next(new AppError('Failed to get market insights', 500));
  }
});

/**
 * Explain calculation methodology
 */
exports.explainCalculation = catchAsync(async (req, res, next) => {
  const { calculationType, inputData, question } = req.body;
  const userId = req.user.id;

  if (!calculationType || !question) {
    return next(new AppError('Calculation type and question are required', 400));
  }

  // This feature can be available to all users (basic explanations)
  // But limit usage for free users
  if (req.user.subscription.tier === 'free') {
    const usageCheck = await req.user.checkUsageLimit('calculation_explanations');
    if (!usageCheck.allowed) {
      return next(new AppError('Daily explanation limit reached. Upgrade to Pro for unlimited explanations.', 429));
    }
  }

  try {
    const aiResponse = await aiService.explainCalculation(calculationType, inputData, question);

    // Track usage
    await req.user.trackUsage('calculation_explanations', 1);

    res.status(200).json({
      status: 'success',
      data: {
        response: aiResponse.response,
        calculationType,
        usage: {
          tokensUsed: aiResponse.usage.total_tokens,
          model: aiResponse.model
        }
      }
    });

  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    return next(new AppError('Failed to explain calculation', 500));
  }
});

/**
 * Get AI service status
 */
exports.getStatus = catchAsync(async (req, res, next) => {
  const status = aiService.getStatus();
  const userHasAccess = req.user.hasFeatureAccess('llm_assistant');
  const usageStats = await req.user.getUsageStats('ai_requests');

  res.status(200).json({
    status: 'success',
    data: {
      aiService: status,
      userAccess: {
        hasAccess: userHasAccess,
        subscription: req.user.subscription.tier,
        usage: usageStats
      }
    }
  });
}); 