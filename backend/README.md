# Real Estate Investment Analysis Tool - Backend API

## 🏗️ Architecture Overview

This is a modern, scalable Node.js/Express backend API designed to support all features of the Real Estate Investment Analysis Tool across all planned sprints.

### 🎯 Key Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Subscription Management**: Three-tier subscription system (Free, Pro, Business)
- **Analysis Engine**: Comprehensive real estate investment calculations
- **API Integrations**: Ready for Zillow, AirDNA, Walk Score, and more
- **Report Generation**: PDF report generation with pay-per-report model
- **Payment Processing**: Stripe integration for subscriptions and one-time payments
- **Team Collaboration**: Multi-user workspace support
- **Security**: Rate limiting, CORS, helmet, input validation
- **Monitoring**: Comprehensive logging with Winston
- **Testing**: Jest test framework with coverage reporting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, set JWT_SECRET and MONGODB_URI

# Start development server
npm run dev
```

### Available Scripts

```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm test           # Run tests
npm run test:watch # Watch mode testing
npm run test:coverage # Coverage report
npm run lint       # ESLint
npm run docs       # Generate API documentation
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
│   ├── index.js     # Main config with env vars
│   └── database.js  # MongoDB connection
├── controllers/     # Request handlers (to be implemented)
├── middleware/      # Custom middleware
│   ├── auth.js      # Authentication & authorization
│   ├── errorHandler.js # Global error handling
│   └── notFound.js  # 404 handler
├── models/          # Database models
│   ├── User.js      # User model with auth & subscriptions
│   └── Analysis.js  # Analysis model with results
├── routes/          # API route definitions
│   ├── auth.js      # Authentication routes
│   ├── user.js      # User management
│   ├── analysis.js  # Analysis CRUD & calculations
│   ├── property.js  # Property data & API integrations
│   ├── report.js    # Report generation
│   ├── payment.js   # Stripe integration
│   └── webhook.js   # Webhook handlers
├── services/        # Business logic (to be implemented)
├── utils/           # Utility functions
│   └── logger.js    # Winston logging configuration
├── validators/      # Input validation schemas (to be implemented)
└── server.js        # Main application entry point
```

## 🔐 Authentication System

### JWT-Based Authentication
- Access tokens (7 days default)
- Refresh tokens (30 days default)
- Password reset tokens (10 minutes)
- Email verification tokens (24 hours)

### Authorization Levels
- **User**: Basic access to own data
- **Admin**: Full system access
- **Moderator**: Limited admin capabilities

### Subscription Tiers
- **Free**: Basic analysis, pay-per-report
- **Pro**: All integrations, unlimited reports, LLM assistant
- **Business**: Team collaboration, white-label, API access

## 📊 Database Schema

### User Model
- Basic profile information
- Authentication & security
- Subscription management
- Usage tracking
- Preferences & settings
- Team management

### Analysis Model
- Property data with validations
- Analysis settings & MODA weights
- Results for all three strategies
- Sharing & collaboration
- Version control

## 🛣️ API Routes

### Authentication (`/api/v1/auth`)
```
POST   /register              # User registration
POST   /login                 # User login
POST   /logout                # User logout
POST   /forgot-password       # Request password reset
PATCH  /reset-password/:token # Reset password
GET    /verify-email/:token   # Verify email
POST   /resend-verification   # Resend verification email
PATCH  /update-password       # Update password (protected)
```

### Users (`/api/v1/users`)
```
GET    /me                    # Get current user
PATCH  /me                    # Update current user
DELETE /me                    # Delete account
GET    /preferences           # Get user preferences
PATCH  /preferences           # Update preferences
GET    /subscription          # Get subscription info
PATCH  /subscription          # Update subscription
GET    /usage                 # Get usage statistics
```

### Analysis (`/api/v1/analysis`)
```
POST   /calculate             # Calculate analysis (free)
GET    /                      # Get user's analyses
POST   /                      # Create saved analysis
GET    /:id                   # Get specific analysis
PATCH  /:id                   # Update analysis
DELETE /:id                   # Delete analysis
POST   /:id/clone            # Clone analysis
PATCH  /:id/bookmark         # Toggle bookmark
PATCH  /:id/share            # Share analysis
GET    /public/:slug          # Get public analysis
GET    /portfolio/summary     # Portfolio summary (Pro+)
```

### Property Data (`/api/v1/properties`)
```
GET    /search                # Search properties
GET    /zillow/:zpid          # Get Zillow data
POST   /zillow/lookup         # Lookup by address
GET    /market-data/:city/:state # Market data
GET    /rental-comps/:address # Rental comparables
GET    /str-data/:address     # STR performance data
GET    /walk-score/:address   # Walk Score
GET    /demographics/:address # Demographics
```

### Reports (`/api/v1/reports`)
```
POST   /generate              # Generate report
GET    /download/:reportId    # Download report
GET    /                      # Get user's reports (Pro+)
GET    /:id                   # Get specific report (Pro+)
DELETE /:id                   # Delete report (Pro+)
POST   /templates             # Create template (Business)
GET    /templates             # Get templates (Business)
```

### Payments (`/api/v1/payments`)
```
GET    /plans                 # Get subscription plans
POST   /create-subscription   # Create subscription
POST   /update-subscription   # Update subscription
POST   /cancel-subscription   # Cancel subscription
GET    /billing-history       # Get billing history
POST   /pay-per-report        # One-time report payment
POST   /create-portal-session # Stripe customer portal
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Joi/express-validator
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Secure token generation
- **Account Lockout**: Brute force protection
- **HTTPS Only**: Production security

## 📈 Monitoring & Logging

### Winston Logger
- Console logging (development)
- File logging (production)
- Error tracking
- API request logging
- Database operation logging
- Payment event logging

### Health Checks
- `/health` endpoint
- Database connectivity
- External API status
- Memory usage
- Response times

## 🧪 Testing Strategy

### Test Structure
```
tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
├── e2e/            # End-to-end tests
└── fixtures/       # Test data
```

### Coverage Requirements
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## 🚀 Deployment

### Environment Variables
See `.env.example` for all required variables.

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB URI
- [ ] Set strong JWT secrets
- [ ] Configure email service
- [ ] Set up external API keys
- [ ] Configure Stripe keys
- [ ] Set up Redis (optional)
- [ ] Configure logging
- [ ] Set up monitoring

## 🔄 Sprint Readiness

This backend architecture is designed to support all planned sprints:

### ✅ Sprint 2 Ready
- User authentication & management
- Basic CRUD operations
- Database models

### ✅ Sprint 3 Ready
- API integration endpoints
- External service wrappers
- Data caching infrastructure

### ✅ Sprint 4 Ready
- Analysis management
- Portfolio tracking
- Data export capabilities

### ✅ Sprint 5 Ready
- Report generation endpoints
- PDF creation infrastructure
- Template management

### ✅ Sprint 6 Ready
- Advanced reporting features
- Custom templates
- Bulk operations

### ✅ Sprint 7 Ready
- LLM integration endpoints
- AI assistant infrastructure
- Advanced analytics

### ✅ Sprint 8 Ready
- Team collaboration
- Enterprise features
- White-label customization

### ✅ Sprint 9 Ready
- Performance optimization
- Mobile API optimizations
- Caching strategies

## 🤝 Contributing

### Code Style
- ESLint configuration included
- Prettier for formatting
- Conventional commits

### Development Flow
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run linting & tests
5. Submit pull request

## 📚 API Documentation

API documentation is automatically generated using Swagger/OpenAPI and available at `/api-docs` in development mode.

## 🐛 Error Handling

- Global error handler middleware
- Custom AppError class
- Environment-specific error responses
- Comprehensive error logging
- User-friendly error messages

## 🚦 Rate Limiting

- Global rate limiting (100 requests per 15 minutes)
- User-specific rate limiting
- Feature-based limitations
- Subscription tier enforcement

---

## 🔧 Implementation Status

### ✅ Completed
- Project structure and configuration
- Database models (User, Analysis)
- Authentication middleware
- Route definitions
- Error handling
- Logging system
- Security setup

### 🔄 Next Steps (Ready for Implementation)
1. **Controllers**: Implement all route handlers
2. **Services**: Business logic layer
3. **Validators**: Input validation schemas
4. **External APIs**: Integration services
5. **Testing**: Comprehensive test suite
6. **Documentation**: Complete API docs

This foundation provides a solid, scalable base for implementing all planned features across the development roadmap. 