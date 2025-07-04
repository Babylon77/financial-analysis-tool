const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'Please provide your first name'],
    trim: true,
    maxlength: [50, 'First name cannot be longer than 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Please provide your last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be longer than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    index: true,
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || validator.isMobilePhone(v, 'any');
      },
      message: 'Please provide a valid phone number',
    },
  },

  // Authentication
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Never show password in output
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Account Status
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  // Role & Permissions
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },

  // Subscription Management
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro', 'business'],
    default: 'free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'unpaid', 'incomplete'],
    default: 'active',
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  trialEndsAt: Date,

  // Usage Tracking
  usage: {
    savedAnalyses: {
      type: Number,
      default: 0,
    },
    reportsGenerated: {
      type: Number,
      default: 0,
    },
    lastReportDate: Date,
    apiCalls: {
      type: Number,
      default: 0,
    },
    lastApiCall: Date,
  },

  // User Preferences
  preferences: {
    defaultModaWeights: {
      roi: {
        type: Number,
        default: 35,
        min: 0,
        max: 100,
      },
      cashFlow: {
        type: Number,
        default: 30,
        min: 0,
        max: 100,
      },
      risk: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      workload: {
        type: Number,
        default: 15,
        min: 0,
        max: 100,
      },
    },
    favoriteMarkets: [String],
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'CAD', 'EUR', 'GBP'],
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
      reports: {
        type: Boolean,
        default: true,
      },
    },
  },

  // Profile Information
  profile: {
    avatar: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be longer than 500 characters'],
    },
    company: String,
    title: String,
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isURL(v);
        },
        message: 'Please provide a valid website URL',
      },
    },
    location: String,
  },

  // Security
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  lastLoginAt: Date,
  lastLoginIP: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },

  // Team Management (for Business tier)
  teamId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
  },
  teamRole: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member',
  },

  // Metadata
  referredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  utm: {
    source: String,
    medium: String,
    campaign: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ stripeCustomerId: 1 });
userSchema.index({ subscriptionTier: 1, subscriptionStatus: 1 });
userSchema.index({ teamId: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run if password was modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Set passwordChangedAt field
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

// Pre-save middleware to validate MODA weights sum to 100
userSchema.pre('save', function(next) {
  if (this.preferences && this.preferences.defaultModaWeights) {
    const weights = this.preferences.defaultModaWeights;
    const total = weights.roi + weights.cashFlow + weights.risk + weights.workload;
    
    if (total !== 100) {
      return next(new Error('MODA weights must sum to 100'));
    }
  }
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Instance method to create email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Instance method to check subscription limits
userSchema.methods.checkUsageLimit = function(feature) {
  const config = require('../config');
  const subscription = config.subscription[`${this.subscriptionTier}Tier`];
  
  if (!subscription) return false;

  // Unlimited access
  if (subscription.limits[feature] === -1) return true;

  // Check current usage against limit
  return this.usage[feature] < subscription.limits[feature];
};

// Instance method to increment usage
userSchema.methods.incrementUsage = function(feature, amount = 1) {
  if (!this.usage[feature]) {
    this.usage[feature] = 0;
  }
  this.usage[feature] += amount;
  return this.save();
};

// Instance method to check if user has feature access
userSchema.methods.hasFeature = function(featureName) {
  const config = require('../config');
  const subscription = config.subscription[`${this.subscriptionTier}Tier`];
  
  return subscription && subscription.features.includes(featureName);
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Query middleware to exclude inactive users by default
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  if (!this.getQuery().active) {
    this.find({ active: { $ne: false } });
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User; 