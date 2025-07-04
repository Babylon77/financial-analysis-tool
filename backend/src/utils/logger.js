const winston = require('winston');
const path = require('path');
const config = require('../config');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.dirname(config.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} ${level}: ${message}\n${stack}`;
    }
    return `${timestamp} ${level}: ${message}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    level: config.logLevel,
    format: consoleFormat,
    silent: config.nodeEnv === 'test', // Silence console logs during testing
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: config.logFile,
    level: 'info',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Separate file for errors
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: {
    service: 'real-estate-analysis-api',
    environment: config.nodeEnv,
  },
  transports,
  exitOnError: false,
});

// Add custom methods for structured logging
logger.apiRequest = (req, res, responseTime) => {
  logger.info('API Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userId: req.user?.id,
  });
};

logger.apiError = (req, error, statusCode = 500) => {
  logger.error('API Error', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    statusCode,
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
  });
};

logger.dbOperation = (operation, collection, duration, success = true) => {
  logger.info('Database Operation', {
    operation,
    collection,
    duration: `${duration}ms`,
    success,
  });
};

logger.externalAPI = (service, endpoint, duration, success = true, statusCode = null) => {
  logger.info('External API Call', {
    service,
    endpoint,
    duration: `${duration}ms`,
    success,
    statusCode,
  });
};

logger.paymentEvent = (event, amount, currency, userId, success = true) => {
  logger.info('Payment Event', {
    event,
    amount,
    currency,
    userId,
    success,
    timestamp: new Date().toISOString(),
  });
};

// Handle uncaught exceptions and unhandled rejections
if (config.nodeEnv !== 'test') {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat,
    })
  );
  
  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat,
    })
  );
}

module.exports = logger; 