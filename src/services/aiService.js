const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

class AIService {
  constructor() {
    this.baseUrl = `${API_BASE}/ai`;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * General chat with AI assistant
   */
  async chat(message, conversationHistory = []) {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          message,
          conversationHistory
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI response');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }

  /**
   * Get AI analysis of investment
   */
  async analyzeInvestment(analysisId, question = null) {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          analysisId,
          question
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze investment');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Get financial planning advice
   */
  async getPlanningAdvice(question, goals = null, currentSituation = null) {
    try {
      const response = await fetch(`${this.baseUrl}/planning`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          question,
          goals,
          currentSituation
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get planning advice');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Planning Error:', error);
      throw error;
    }
  }

  /**
   * Get market insights
   */
  async getMarketInsights(location, propertyType, question) {
    try {
      const response = await fetch(`${this.baseUrl}/market`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          location,
          propertyType,
          question
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get market insights');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Market Error:', error);
      throw error;
    }
  }

  /**
   * Explain calculation methodology
   */
  async explainCalculation(calculationType, question, inputData = null) {
    try {
      const response = await fetch(`${this.baseUrl}/explain`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          calculationType,
          question,
          inputData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to explain calculation');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Explanation Error:', error);
      throw error;
    }
  }

  /**
   * Get AI service status
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI status');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Status Error:', error);
      throw error;
    }
  }

  /**
   * Check if user has AI access
   */
  async checkAccess() {
    try {
      const status = await this.getStatus();
      return status.data?.userAccess?.hasAccess || false;
    } catch (error) {
      console.error('AI Access Check Error:', error);
      return false;
    }
  }
}

export default new AIService(); 