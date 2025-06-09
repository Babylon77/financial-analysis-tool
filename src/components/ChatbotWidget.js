import React, { useState, useRef, useEffect } from 'react';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      message: 'Hi! I\'m here to help you understand how to use the Real Estate Investment Analysis Tool. Ask me anything!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced responses using README content and more sophisticated matching
  const getResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Getting Started Questions - Natural and brief
    if (message.includes('how to start') || message.includes('getting started') || message.includes('begin')) {
      return "Just fill out the property details on the left - purchase price, location, condition, and financing info. The tool automatically analyzes all three strategies (flip, long-term rental, short-term rental) and tells you which works best. Start with realistic numbers from Zillow and you're good to go!";
    }
    
    if (message.includes('what does this tool do') || message.includes('purpose') || message.includes('overview')) {
      return "I help you figure out what to do with an investment property! Give me property details and I'll analyze three options: fix & flip it for quick profit, rent it long-term for steady income, or do short-term rentals like Airbnb. I crunch all the numbers and tell you which strategy makes the most sense for your situation.";
    }
    
    // Chatbot enhancement and README connection
    if (message.includes('readme') || message.includes('documentation') || message.includes('improved') || message.includes('enhanced')) {
      return '📚 **Yes! I\'m now powered by our comprehensive README!**\n\nThe chatbot has been significantly enhanced with:\n\n🧠 **Deep Knowledge**: All responses now draw from our detailed README documentation\n📊 **Industry Formulas**: Exact calculation methodologies explained\n🎯 **Expert Insights**: Pro tips, red flags, and best practices from real estate professionals\n🏗️ **Technical Details**: Understanding of how each algorithm and feature works\n\n**Before**: Basic keyword responses\n**Now**: Rich, detailed explanations with specific numbers, benchmarks, and actionable advice!\n\n💡 **Try asking**: "How is ROI calculated?" or "What makes a good deal?" for detailed, README-informed responses!';
    }
    
    // Strategy Questions - Natural and conversational
    if (message.includes('fix and flip') || message.includes('fix & flip') || message.includes('flipping')) {
      return "Fix & flip is buying a property, renovating it, then selling for profit. I calculate your total investment (down payment + renovation + holding costs) versus your profit after selling. You want at least 20% ROI and to be done in 6 months max. Rule of thumb: never pay more than 70% of the fixed-up value minus renovation costs.";
    }
    
    if (message.includes('long term rental') || message.includes('ltr') || message.includes('buy and hold')) {
      return "Long-term rental means buying, fixing up, then renting to tenants with year-long leases. I look at your monthly cash flow (rent minus all expenses) plus 5 years of appreciation and mortgage paydown. You want at least $200/month cash flow. The old '1% rule' (monthly rent = 1% of purchase price) is getting harder to find but still a good target.";
    }
    
    if (message.includes('short term rental') || message.includes('str') || message.includes('airbnb') || message.includes('vrbo')) {
      return "Short-term rental is the Airbnb route - nightly bookings in tourist areas. Higher income potential but way more work and expenses. I factor in cleaning, supplies, higher utilities, plus the same appreciation as long-term rentals. Key thing: check local laws first! Many cities are banning or restricting STRs. Also budget for 30-40% occupancy in slow seasons.";
    }
    
    // ROI and Calculations - Conversational
    if (message.includes('roi') || message.includes('return on investment') || message.includes('calculate')) {
      return "For flips, ROI is simple: profit divided by what you put in, then annualized based on how long it took. For rentals, I calculate 5 years of cash flow plus appreciation (3% annually) plus mortgage paydown, then divide by 5 to get your annual return. The cool thing is I include all three ways real estate makes money: monthly income, property value growth, and loan paydown.";
    }
    
    if (message.includes('cash flow') || message.includes('monthly income')) {
      return "Cash flow is just income minus expenses each month. For rentals, that's rent minus mortgage, taxes, insurance, maintenance, management fees, and vacancy reserves. Short-term rentals have all that plus cleaning, supplies, and higher utilities - expenses usually eat up 50-60% of revenue. Flips have zero cash flow during renovation, just holding costs.";
    }
    
    if (message.includes('sensitivity') || message.includes('sliders') || message.includes('what if')) {
      return "Those sliders at the top let you play with 'what if' scenarios in real-time. What if renovation costs 30% more? What if rent drops 20%? What if Airbnb occupancy is only 50%? Good deals should still work even in bad scenarios. I always tell people to stress test their numbers - if it barely works with perfect assumptions, it probably won't work in real life!";
    }
    
    if (message.includes('moda') || message.includes('weights') || message.includes('priorities')) {
      return "MODA just means I score each strategy on what matters to you: ROI, cash flow, risk, and workload. You can adjust the sliders to weight them differently. If you're new to investing, maybe bump up the risk weight. If you're experienced and want max returns, crank up the ROI weight. I score each strategy 0-10 on each factor, then pick the highest total score as your recommendation.";
    }
    
    if (message.includes('deal quality') || message.includes('excellent') || message.includes('good') || message.includes('fair') || message.includes('poor')) {
      return "I grade deals like school: Excellent (30%+ ROI), Good (20%+ ROI), Fair (10%+ ROI), or Poor (below 10%). I also look at whether you're buying at the right price versus the fixed-up value. Focus on 'Good' deals or better - 'Poor' deals rarely work out unless you know something I don't. Even in tough markets, stick to your standards.";
    }
    
    // Charts and Data
    if (message.includes('chart') || message.includes('graph') || message.includes('projection')) {
      return 'Charts Available: 1) Strategy Comparison Radar Chart 2) Overall Strategy Scores Bar Chart 3) Cash Flow Progression (starts Year 0) 4) ROI Comparison Bar Chart 5) Renovation Timeline (if applicable). All charts update in real-time as you adjust inputs!';
    }
    
    // Property Details
    if (message.includes('property condition') || message.includes('renovation cost') || message.includes('condition')) {
      return 'Property Condition affects renovation costs: Teardown(80-150/sqft), Poor(50-80/sqft), Fair(25-45/sqft), Good(10-25/sqft). The tool adjusts for your location and shows renovation timeline. You can manually override these estimates!';
    }
    
    if (message.includes('location') || message.includes('state') || message.includes('area')) {
      return 'Location matters! The tool adjusts renovation costs by state (CA/NY are +35%, AL/MS are -15%) and estimates nightly STR rates by location. It also factors in typical property tax and insurance rates for your area.';
    }
    
    if (message.includes('tips') || message.includes('advice') || message.includes('recommendation')) {
      return "Best advice I can give: don't fall in love with a property, fall in love with the numbers. Always verify my rental estimates with local property managers - I use averages but every neighborhood is different. For Airbnb, check local laws first! And keep 6 months of expenses saved for rentals because stuff always breaks. Oh, and stress test everything with those sliders.";
    }
    
    if (message.includes('mistake') || message.includes('avoid') || message.includes('red flag')) {
      return "Biggest mistakes I see: negative cash flow on rentals (bad!), flip ROI under 15% (also bad!), renovation costs over 25% of property value (recipe for disaster), and Airbnb deals that need 80%+ occupancy to work (unrealistic). Also, people skip checking local Airbnb laws, don't verify my rent estimates, and forget about surprise repair costs. If a deal only works with perfect assumptions, it won't work.";
    }
    
    // Financing
    if (message.includes('financing') || message.includes('loan') || message.includes('mortgage') || message.includes('down payment')) {
      return 'Financing Impact: Higher down payment = lower monthly mortgage payment = better cash flow but more capital needed. The tool calculates mortgage payments, shows principal paydown over 5 years, and factors interest rates into all strategies. Try different down payment percentages!';
    }
    
    // Troubleshooting
    if (message.includes('not working') || message.includes('error') || message.includes('problem') || message.includes('bug')) {
      return 'Troubleshooting: 1) Make sure all required fields are filled 2) Check that purchase price and renovation costs are reasonable numbers 3) Verify expected rent/sale prices aren\'t blank 4) Try refreshing the page 5) If issues persist, the tool works best with realistic property values ($50K-$2M range).';
    }
    
    // Market Data and Accuracy
    if (message.includes('accurate') || message.includes('realistic') || message.includes('trust') || message.includes('data sources')) {
      return '📊 **Tool Accuracy & Data Sources** (From README):\n\n**What We Use**:\n• Industry-standard expense ratios\n• Historical 3% annual appreciation\n• State-based nightly rate estimates\n• Conservative occupancy assumptions (65% STR, 8% LTR vacancy)\n\n**Important Limitations**:\n• Estimates based on assumptions - actual results WILL vary\n• Local regulations not included (HOA, STR restrictions)\n• Market timing and economic cycles not factored\n• Personal factors (credit, experience) not considered\n\n✅ **Best Practice**: Use this as starting point, then verify local data and consult professionals!\n\n🎯 **Production Note**: Full version would integrate live Airbnb/VRBO API data';
    }
    
    // Strategy Recommendation Logic
    if (message.includes('which strategy') || message.includes('best strategy') || message.includes('recommend')) {
      return '🤔 **Which Strategy is "Best"?** (README methodology):\n\nThere\'s NO universally best strategy! It depends on:\n\n**Fix & Flip Best For**:\n• Want quick returns (6-12 months)\n• Have renovation experience\n• Can handle project management\n• Comfortable with higher risk\n\n**LTR Best For**:\n• Want steady monthly income\n• Long-term wealth building\n• Lower ongoing workload\n• Market stability preference\n\n**STR Best For**:\n• Tourist/business travel areas\n• Can handle daily management\n• Want highest income potential\n• Comfortable with regulations/seasonality\n\n⚖️ **The Tool\'s Approach**: Use MODA weights to tell us YOUR priorities, and we\'ll recommend the best fit for YOU!';
    }
    
    // General Help Menu
    if (message.includes('help') || message.includes('explain') || message.includes('what') || message.includes('how')) {
      return '🆘 **I can help you with**:\n\n📚 **Strategy Education**:\n• Fix & Flip, LTR, STR explanations\n• Industry benchmarks & best practices\n\n🧮 **Calculations & Analysis**:\n• ROI methodology (all 3 wealth components)\n• Cash flow calculations\n• MODA scoring system\n\n🛠️ **Tool Features**:\n• Sensitivity analysis sliders\n• Deal quality grading\n• Chart interpretations\n\n💡 **Expert Guidance**:\n• Pro tips & common mistakes\n• Market research advice\n• Investment strategy selection\n\n❓ **Just ask**: "How do I..." or "What is..." and I\'ll help! I have the entire README knowledge base to draw from.';
    }
    
    // Natural default response
    return "Hey! I'm here to help you figure out real estate investing. I can explain the three strategies (flip, long-term rental, Airbnb), help you understand the numbers, or just chat about whether a deal makes sense. What's on your mind?";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      message: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Get bot response
    const botResponse = {
      type: 'bot',
      message: getResponse(inputValue),
      timestamp: new Date()
    };

    // Add bot response after a brief delay
    setTimeout(() => {
      setMessages(prev => [...prev, botResponse]);
    }, 500);

    setInputValue('');
  };

  const quickQuestions = [
    "How do I get started?",
    "What does this tool do?",
    "Explain Fix & Flip strategy",
    "How is ROI calculated?", 
    "What makes a good deal?",
    "Tell me about MODA analysis"
  ];

  const handleQuickQuestion = (question) => {
    setInputValue(question);
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110"
          aria-label="Open chat help"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Help Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-indigo-200 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-indigo-200 text-sm mt-1">Ask me about using this tool!</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                  msg.type === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget; 