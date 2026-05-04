const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const filterObj = (obj, ...allowedFields) => {
  const filtered = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) filtered[key] = obj[key];
  });
  return filtered;
};

exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(new AppError('Use /update-password for password changes.', 400));
  }

  const filteredBody = filterObj(
    req.body,
    'firstName', 'lastName', 'phone', 'profile'
  );

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getPreferences = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('preferences');

  res.status(200).json({
    status: 'success',
    data: { preferences: user.preferences },
  });
});

exports.updatePreferences = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (req.body.defaultModaWeights) {
    user.preferences.defaultModaWeights = {
      ...user.preferences.defaultModaWeights,
      ...req.body.defaultModaWeights,
    };
  }
  if (req.body.favoriteMarkets) user.preferences.favoriteMarkets = req.body.favoriteMarkets;
  if (req.body.currency) user.preferences.currency = req.body.currency;
  if (req.body.notifications) {
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...req.body.notifications,
    };
  }

  await user.save();

  res.status(200).json({
    status: 'success',
    data: { preferences: user.preferences },
  });
});

exports.getSubscription = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    'subscriptionTier subscriptionStatus subscriptionStartDate subscriptionEndDate trialEndsAt'
  );

  res.status(200).json({
    status: 'success',
    data: { subscription: user },
  });
});

exports.updateSubscription = catchAsync(async (req, res, next) => {
  return next(new AppError('Subscription changes are handled via the payment system.', 400));
});

exports.getUsage = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('usage subscriptionTier');

  res.status(200).json({
    status: 'success',
    data: { usage: user.usage, tier: user.subscriptionTier },
  });
});

// Admin-only routes
exports.getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const users = await User.find().skip(skip).limit(limit);
  const total = await User.countDocuments();

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: { users },
  });
});

exports.createUser = catchAsync(async (req, res) => {
  const user = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { user },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError('No user found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Financial data sync
exports.getFinancialData = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('financialData');

  res.status(200).json({
    status: 'success',
    data: { financialData: user.financialData || null },
  });
});

exports.saveFinancialData = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { financialData: req.body, financialDataUpdatedAt: Date.now() },
    { new: true, runValidators: false }
  );

  logger.info(`Financial data saved for user: ${user.email}`);

  res.status(200).json({
    status: 'success',
    data: { financialData: user.financialData },
  });
});
