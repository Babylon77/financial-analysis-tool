const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  // Ownership
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Analysis must belong to a user'],
    index: true,
  },

  // Basic Information
  name: {
    type: String,
    required: [true, 'Analysis must have a name'],
    trim: true,
    maxlength: [100, 'Analysis name cannot be longer than 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be longer than 500 characters'],
  },
  tags: [String],

  // Property Data
  propertyData: {
    // Basic Property Info
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'US' },
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    squareFootage: {
      type: Number,
      min: [0, 'Square footage cannot be negative'],
    },
    bedrooms: {
      type: Number,
      min: [0, 'Bedrooms cannot be negative'],
    },
    bathrooms: {
      type: Number,
      min: [0, 'Bathrooms cannot be negative'],
    },
    yearBuilt: {
      type: Number,
      min: [1800, 'Year built seems too old'],
      max: [new Date().getFullYear() + 5, 'Year built cannot be in the future'],
    },
    propertyType: {
      type: String,
      enum: ['single-family', 'condo', 'townhouse', 'duplex', 'multi-family', 'other'],
    },

    // Financial Details
    renovationCosts: {
      type: Number,
      default: 0,
      min: [0, 'Renovation costs cannot be negative'],
    },
    afterRepairValue: {
      type: Number,
      min: [0, 'After repair value cannot be negative'],
    },
    downPayment: {
      type: Number,
      min: [0, 'Down payment cannot be negative'],
    },
    interestRate: {
      type: Number,
      min: [0, 'Interest rate cannot be negative'],
      max: [50, 'Interest rate seems too high'],
    },
    loanTerm: {
      type: Number,
      default: 30,
      min: [1, 'Loan term must be at least 1 year'],
      max: [50, 'Loan term cannot exceed 50 years'],
    },
    closingCosts: {
      type: Number,
      default: 0,
      min: [0, 'Closing costs cannot be negative'],
    },

    // Market Data
    marketData: {
      monthlyRent: {
        type: Number,
        min: [0, 'Monthly rent cannot be negative'],
      },
      nightly: {
        rate: {
          type: Number,
          min: [0, 'Nightly rate cannot be negative'],
        },
        occupancyRate: {
          type: Number,
          min: [0, 'Occupancy rate cannot be negative'],
          max: [100, 'Occupancy rate cannot exceed 100%'],
        },
      },
      appreciationRate: {
        type: Number,
        default: 3,
        min: [-10, 'Appreciation rate cannot be less than -10%'],
        max: [20, 'Appreciation rate seems too high'],
      },
    },

    // External API Data
    zillow: {
      zpid: String,
      zestimate: Number,
      rentZestimate: Number,
      lastUpdated: Date,
    },
    walkScore: {
      score: Number,
      description: String,
      lastUpdated: Date,
    },
  },

  // Analysis Settings
  analysisSettings: {
    modaWeights: {
      roi: {
        type: Number,
        default: 35,
        min: [0, 'ROI weight cannot be negative'],
        max: [100, 'ROI weight cannot exceed 100'],
      },
      cashFlow: {
        type: Number,
        default: 30,
        min: [0, 'Cash flow weight cannot be negative'],
        max: [100, 'Cash flow weight cannot exceed 100'],
      },
      risk: {
        type: Number,
        default: 20,
        min: [0, 'Risk weight cannot be negative'],
        max: [100, 'Risk weight cannot exceed 100'],
      },
      workload: {
        type: Number,
        default: 15,
        min: [0, 'Workload weight cannot be negative'],
        max: [100, 'Workload weight cannot exceed 100'],
      },
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'CAD', 'EUR', 'GBP'],
    },
    analysisType: {
      type: String,
      enum: ['comprehensive', 'quick', 'comparison'],
      default: 'comprehensive',
    },
  },

  // Results Data
  results: {
    strategies: {
      fixAndFlip: {
        totalInvestment: Number,
        netProfit: Number,
        roi: Number,
        annualizedROI: Number,
        timeToComplete: Number, // months
        cashFlow: Number, // Always 0 for fix and flip
        riskScore: Number,
        workloadScore: Number,
        modaScore: Number,
      },
      longTermRental: {
        totalInvestment: Number,
        monthlyCashFlow: Number,
        annualCashFlow: Number,
        roi: Number,
        annualizedROI: Number,
        capRate: Number,
        cashOnCashReturn: Number,
        riskScore: Number,
        workloadScore: Number,
        modaScore: Number,
        projections: [{
          year: Number,
          rental_income: Number,
          expenses: Number,
          cash_flow: Number,
          property_value: Number,
        }],
      },
      shortTermRental: {
        totalInvestment: Number,
        monthlyCashFlow: Number,
        annualCashFlow: Number,
        roi: Number,
        annualizedROI: Number,
        occupancyRequired: Number,
        riskScore: Number,
        workloadScore: Number,
        modaScore: Number,
        projections: [{
          year: Number,
          rental_income: Number,
          expenses: Number,
          cash_flow: Number,
          property_value: Number,
        }],
      },
    },
    recommendedStrategy: {
      type: String,
      enum: ['fixAndFlip', 'longTermRental', 'shortTermRental'],
    },
    dealQuality: {
      grade: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      },
      score: Number,
      factors: [String],
    },
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },

  // Sharing and Collaboration
  isPublic: {
    type: Boolean,
    default: false,
  },
  publicSlug: {
    type: String,
    unique: true,
    sparse: true,
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view',
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  }],

  // Version Control
  version: {
    type: Number,
    default: 1,
  },
  parentAnalysisId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Analysis',
  },

  // Metadata
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot be longer than 2000 characters'],
  },
  bookmarked: {
    type: Boolean,
    default: false,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  lastViewedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ 'propertyData.address.city': 1, 'propertyData.address.state': 1 });
analysisSchema.index({ 'results.recommendedStrategy': 1 });
analysisSchema.index({ publicSlug: 1 });
analysisSchema.index({ tags: 1 });
analysisSchema.index({ bookmarked: 1, userId: 1 });

// Virtual for property address
analysisSchema.virtual('propertyAddress').get(function() {
  if (!this.propertyData?.address) return '';
  const addr = this.propertyData.address;
  return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}`.trim();
});

// Virtual for total ROI across all strategies
analysisSchema.virtual('averageROI').get(function() {
  if (!this.results?.strategies) return 0;
  
  const strategies = this.results.strategies;
  const rois = [];
  
  if (strategies.fixAndFlip?.roi) rois.push(strategies.fixAndFlip.roi);
  if (strategies.longTermRental?.roi) rois.push(strategies.longTermRental.roi);
  if (strategies.shortTermRental?.roi) rois.push(strategies.shortTermRental.roi);
  
  return rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;
});

// Pre-save middleware to validate MODA weights
analysisSchema.pre('save', function(next) {
  if (this.analysisSettings?.modaWeights) {
    const weights = this.analysisSettings.modaWeights;
    const total = weights.roi + weights.cashFlow + weights.risk + weights.workload;
    
    if (Math.abs(total - 100) > 0.01) { // Allow for small floating point errors
      return next(new Error('MODA weights must sum to 100'));
    }
  }
  next();
});

// Pre-save middleware to generate public slug if public
analysisSchema.pre('save', function(next) {
  if (this.isPublic && !this.publicSlug) {
    const crypto = require('crypto');
    this.publicSlug = crypto.randomBytes(16).toString('hex');
  } else if (!this.isPublic && this.publicSlug) {
    this.publicSlug = undefined;
  }
  next();
});

// Instance method to clone analysis
analysisSchema.methods.clone = function(newName) {
  const clone = new this.constructor(this.toObject());
  clone._id = undefined;
  clone.isNew = true;
  clone.name = newName || `${this.name} (Copy)`;
  clone.parentAnalysisId = this._id;
  clone.version = 1;
  clone.isPublic = false;
  clone.publicSlug = undefined;
  clone.sharedWith = [];
  clone.viewCount = 0;
  clone.lastViewedAt = undefined;
  clone.createdAt = undefined;
  clone.updatedAt = undefined;
  
  return clone;
};

// Instance method to check if user can access
analysisSchema.methods.canAccess = function(userId, permission = 'view') {
  // Owner always has access
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Check if shared with user
  const sharedEntry = this.sharedWith.find(
    entry => entry.userId.toString() === userId.toString()
  );
  
  if (!sharedEntry) return false;
  
  // Check permission level
  if (permission === 'edit') {
    return sharedEntry.permission === 'edit';
  }
  
  return true; // 'view' access
};

// Static method to find by user with filters
analysisSchema.statics.findByUser = function(userId, filters = {}) {
  const query = { userId };
  
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  if (filters.strategy) {
    query['results.recommendedStrategy'] = filters.strategy;
  }
  
  if (filters.bookmarked) {
    query.bookmarked = true;
  }
  
  return this.find(query).sort({ updatedAt: -1 });
};

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis; 