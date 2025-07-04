require('dotenv').config();

const config = {
  // Server Configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',

  // Database Configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-analysis',
  mongodbTestUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/real-estate-analysis-test',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Redis Configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD || '',
  redisDb: parseInt(process.env.REDIS_DB, 10) || 0,

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'noreply@realestate-analyzer.com',
  },

  // External API Keys
  apis: {
    zillow: process.env.ZILLOW_API_KEY,
    airdna: process.env.AIRDNA_API_KEY,
    googleMaps: process.env.GOOGLE_MAPS_API_KEY,
    walkScore: process.env.WALKSCORE_API_KEY,
    census: process.env.CENSUS_API_KEY,
  },

  // Payment Processing
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 1000,
  },

  // AWS Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },

  // Security Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Logging Configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/app.log',

  // Report Generation
  pdfGenerationTimeout: parseInt(process.env.PDF_GENERATION_TIMEOUT, 10) || 30000,
  maxReportSizeMB: parseInt(process.env.MAX_REPORT_SIZE_MB, 10) || 10,

  // Feature Flags
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  enableCaching: process.env.ENABLE_CACHING !== 'false', // Default to true
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false', // Default to true
  enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',

  // Application Constants
  subscription: {
    freeTier: {
      name: 'Free',
      price: 0,
      features: ['basic_analysis', 'pay_per_report'],
      limits: {
        savedAnalyses: 0,
        reportsPerMonth: 0,
      },
    },
    proTier: {
      name: 'Pro',
      price: 19,
      features: ['all_integrations', 'unlimited_reports', 'llm_assistant', 'portfolio_tracking'],
      limits: {
        savedAnalyses: -1, // Unlimited
        reportsPerMonth: -1, // Unlimited
      },
    },
    businessTier: {
      name: 'Business',
      price: 49,
      features: ['team_collaboration', 'white_label', 'api_access', 'priority_support'],
      limits: {
        savedAnalyses: -1, // Unlimited
        reportsPerMonth: -1, // Unlimited
        teamMembers: 10,
      },
    },
  },

  // Report pricing
  reportPrice: 1.00, // $1 per report for free users
};

// Validation
const requiredEnvVars = ['JWT_SECRET'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push('MONGODB_URI');
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = config; 