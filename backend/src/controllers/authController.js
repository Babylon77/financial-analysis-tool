const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const config = require('../config');
const logger = require('../utils/logger');

const signToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'lax',
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: { user },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 400));
  }

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password,
  });

  logger.info(`New user registered: ${newUser.email}`);

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +active');

  if (!user || !(await user.correctPassword(password, user.password))) {
    if (user) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }
      await user.save({ validateBeforeSave: false });
    }
    return next(new AppError('Incorrect email or password.', 401));
  }

  if (user.isLocked) {
    return next(new AppError('Account temporarily locked. Try again in 15 minutes.', 423));
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = Date.now();
  user.lastLoginIP = req.ip;
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${user.email}`);

  createSendToken(user, 200, req, res);
});

exports.logout = catchAsync(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  // Always respond success to prevent email enumeration
  if (!user) {
    return res.status(200).json({
      status: 'success',
      message: 'If an account exists, a reset link has been sent.',
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  logger.info(`Password reset requested for: ${user.email} (token: ${resetToken})`);

  res.status(200).json({
    status: 'success',
    message: 'If an account exists, a reset link has been sent.',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, req, res);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Verification token is invalid or has expired.', 400));
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully.',
  });
});

exports.resendVerification = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  if (!user || user.emailVerified) {
    return res.status(200).json({
      status: 'success',
      message: 'If an unverified account exists, a verification link has been sent.',
    });
  }

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  logger.info(`Email verification resent for: ${user.email} (token: ${verificationToken})`);

  res.status(200).json({
    status: 'success',
    message: 'If an unverified account exists, a verification link has been sent.',
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  user.password = req.body.password;
  await user.save();

  createSendToken(user, 200, req, res);
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Please provide a refresh token.', 400));
  }

  const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  createSendToken(user, 200, req, res);
});
