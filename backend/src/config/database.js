const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  bufferCommands: false, // Disable mongoose buffering
  bufferMaxEntries: 0, // Disable mongoose buffering
};

// Connection function
const connectDB = async () => {
  try {
    const mongoUri = config.nodeEnv === 'test' ? config.mongodbTestUri : config.mongodbUri;
    
    logger.info(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//<credentials>@')}`);
    
    const conn = await mongoose.connect(mongoUri, options);
    
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('📡 Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('❌ Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ Mongoose disconnected from MongoDB');
    });
    
    // Close connection on process termination
    process.on('SIGINT', async () => {
      logger.info('🔌 Closing MongoDB connection...');
      await mongoose.connection.close();
      process.exit(0);
    });
    
    return conn;
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('🔌 MongoDB connection closed');
  } catch (error) {
    logger.error('❌ Error closing MongoDB connection:', error);
  }
};

// Health check function
const checkDBHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'healthy',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  connectDB,
  closeDB,
  checkDBHealth,
}; 