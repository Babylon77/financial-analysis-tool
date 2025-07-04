const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class AIService {
  constructor() {
    if (!config.openai.apiKey) {
      logger.warn('OpenAI API key not configured - AI features will be disabled');
      this.openai = null;
      return;
    }

    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });

    this.systemPrompt = `You are an expert real estate investment advisor and financial analyst. You help users understand:

1. Real Estate Investment Strategies:
   - Fix & Flip analysis and ROI calculations
   - Long-term rental (LTR) cash flow and appreciation
   - Short-term rental (STR/Airbnb) income optimization
   - Property valuation and market analysis
   - MODA decision framework (ROI, Cash Flow, Risk, Workload)

2. Financial Planning:
   - Investment portfolio optimization
   - Retirement planning and compound interest
   - Real estate vs. stock market analysis
   - Tax strategies for real estate investors
   - Asset allocation and diversification

3. Deal Analysis:
   - Property condition assessment and renovation costs
   - Market rent estimates and vacancy rates
   - Financing options and leverage strategies
   - Risk assessment and sensitivity analysis

Always provide:
- Specific, actionable advice
- Industry benchmarks and standards
- Risk warnings when appropriate
- Numbers-based explanations
- Follow-up questions to gather more context

Keep responses concise but comprehensive. Use bullet points for clarity.`;
  }

  /**
   * Generate AI response with context
   */
  async generateResponse(userMessage, context = {}) {
    if (!this.openai) {
      throw new AppError('AI service is not available - OpenAI API key not configured', 503);
    }

    try {
      // Build context-aware prompt
      let contextPrompt = '';
      if (context.analysisData) {
        contextPrompt += `\n\nCurrent Analysis Context:\n${JSON.stringify(context.analysisData, null, 2)}`;
      }
      if (context.userProfile) {
        contextPrompt += `\n\nUser Profile:\n${JSON.stringify(context.userProfile, null, 2)}`;
      }
      if (context.conversationHistory) {
        contextPrompt += `\n\nRecent Conversation:\n${context.conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
      }

      const messages = [
        { role: 'system', content: this.systemPrompt + contextPrompt },
        { role: 'user', content: userMessage }
      ];

      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: messages,
        max_tokens: config.openai.maxTokens,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0].message.content;
      
      // Log usage for monitoring
      logger.info('AI response generated', {
        tokens_used: completion.usage.total_tokens,
        model: config.openai.model,
        user_message_length: userMessage.length,
        response_length: response.length
      });

      return {
        response,
        usage: completion.usage,
        model: config.openai.model
      };

    } catch (error) {
      logger.error('OpenAI API error:', error);
      
      if (error.code === 'insufficient_quota') {
        throw new AppError('AI service temporarily unavailable - quota exceeded', 503);
      }
      if (error.code === 'rate_limit_exceeded') {
        throw new AppError('AI service busy - please try again in a moment', 429);
      }
      if (error.code === 'invalid_api_key') {
        throw new AppError('AI service configuration error', 500);
      }
      
      throw new AppError('AI service error - please try again', 500);
    }
  }

  /**
   * Analyze a real estate deal and provide AI insights
   */
  async analyzeInvestment(analysisData, userQuestion = null) {
    if (!this.openai) {
      throw new AppError('AI service is not available', 503);
    }

    const prompt = userQuestion || 
      `Please analyze this real estate investment opportunity and provide insights on:
      1. Deal quality and potential red flags
      2. Strategy recommendation (flip vs rental)
      3. Key risks and mitigation strategies
      4. Market considerations
      5. Specific improvement suggestions`;

    return this.generateResponse(prompt, { analysisData });
  }

  /**
   * Provide financial planning advice
   */
  async providePlanningAdvice(userGoals, currentSituation, question) {
    if (!this.openai) {
      throw new AppError('AI service is not available', 503);
    }

    const context = {
      userProfile: {
        goals: userGoals,
        currentSituation: currentSituation
      }
    };

    return this.generateResponse(question, context);
  }

  /**
   * Get market insights and trends
   */
  async getMarketInsights(location, propertyType, question) {
    if (!this.openai) {
      throw new AppError('AI service is not available', 503);
    }

    const prompt = `${question}\n\nContext: Looking at ${propertyType} properties in ${location}. Please provide current market insights, trends, and investment considerations for this area and property type.`;

    return this.generateResponse(prompt);
  }

  /**
   * Explain calculation methodology
   */
  async explainCalculation(calculationType, inputData, question) {
    if (!this.openai) {
      throw new AppError('AI service is not available', 503);
    }

    const prompt = `${question}\n\nCalculation Type: ${calculationType}\nInput Data: ${JSON.stringify(inputData, null, 2)}\n\nPlease explain the methodology, assumptions, and key factors that influence this calculation.`;

    return this.generateResponse(prompt);
  }

  /**
   * Check if AI service is available
   */
  isAvailable() {
    return this.openai !== null;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      model: config.openai.model,
      maxTokens: config.openai.maxTokens,
      configured: !!config.openai.apiKey
    };
  }
}

// Export singleton instance
module.exports = new AIService(); 