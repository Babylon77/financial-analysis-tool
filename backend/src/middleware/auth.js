const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { AppError, catchAsync } = require('./errorHandler');
const config = require('../config');
const logger = require('../utils/logger');

// Verify JWT token
const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, config.jwtSecret);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id).select('+active');
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist.', 401)
    );
  }

  // 4) Check if user is active
  if (!currentUser.active) {
    return next(new AppError('Your account has been deactivated.', 401));
  }

  // 5) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

// Optional authentication (for routes that work with or without auth)
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = await promisify(jwt.verify)(token, config.jwtSecret);
      const currentUser = await User.findById(decoded.id).select('+active');
      
      if (currentUser && currentUser.active && !currentUser.changedPasswordAfter(decoded.iat)) {
        req.user = currentUser;
      }
    } catch (error) {
      // Token is invalid, but that's okay for optional auth
      logger.warn('Invalid token in optional auth:', error.message);
    }
  }

  next();
});

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Check subscription tier
const requireSubscription = (...tiers) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this feature.', 401));
    }

    if (!tiers.includes(req.user.subscriptionTier)) {
      const tierNames = tiers.join(' or ');
      return next(
        new AppError(`This feature requires a ${tierNames} subscription.`, 403)
      );
    }

    next();
  };
};

// Check feature access based on subscription
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this feature.', 401));
    }

    const subscription = config.subscription[`${req.user.subscriptionTier}Tier`];
    
    if (!subscription || !subscription.features.includes(featureName)) {
      return next(
        new AppError(`This feature is not available in your current subscription plan.`, 403)
      );
    }

    next();
  };
};

// Rate limiting by user
const userRateLimit = (maxRequests, windowMs = 900000) => {
  const users = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!users.has(userId)) {
      users.set(userId, []);
    }

    const userRequests = users.get(userId);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    users.set(userId, validRequests);

    if (validRequests.length >= maxRequests) {
      return next(
        new AppError(`Too many requests. Please try again later.`, 429)
      );
    }

    // Add current request
    validRequests.push(now);
    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
  requireSubscription,
  requireFeature,
  userRateLimit,
}; 