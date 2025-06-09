import React, { useState, useEffect } from 'react';

const TutorialHints = ({ showRandomHint = true }) => {
  const [currentHint, setCurrentHint] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showAllHints, setShowAllHints] = useState(false);

  // Comprehensive list of hints
  const hints = [
    {
      category: "Getting Started",
      title: "Start with Realistic Numbers",
      description: "Enter actual market values for your area. Use Zillow, Realtor.com, or recent sales for purchase prices.",
      icon: "🏠"
    },
    {
      category: "Getting Started", 
      title: "Property Condition Matters",
      description: "Select the correct condition - it affects renovation costs by 100%+. 'Fair' means cosmetic work, 'Poor' needs major repairs.",
      icon: "🔨"
    },
    {
      category: "Strategy Selection",
      title: "Location Drives Strategy",
      description: "Tourist areas favor STR, family neighborhoods favor LTR, and emerging areas favor Fix & Flip.",
      icon: "📍"
    },
    {
      category: "Strategy Selection",
      title: "Consider Your Time",
      description: "STR requires daily management, LTR needs monthly oversight, Fix & Flip is intense then done.",
      icon: "⏰"
    },
    {
      category: "Financial Analysis",
      title: "Cash Flow is King",
      description: "Positive cash flow of $200+/month for rentals is ideal. Negative cash flow means you pay monthly.",
      icon: "💰"
    },
    {
      category: "Financial Analysis",
      title: "The 1% Rule",
      description: "Monthly rent should equal 1% of purchase price. Getting harder to find but still a good benchmark.",
      icon: "📊"
    },
    {
      category: "Financial Analysis",
      title: "Total ROI vs Cash-on-Cash",
      description: "Our 'Total ROI' includes appreciation and principal paydown - much more accurate than cash-on-cash alone.",
      icon: "📈"
    },
    {
      category: "Risk Management",
      title: "Stress Test with Sliders",
      description: "Use sensitivity sliders to test worst-case scenarios. What if rent drops 20% or vacancy hits 15%?",
      icon: "🎚️"
    },
    {
      category: "Risk Management",
      title: "Deal Quality Grades Matter",
      description: "Focus on 'Good' or 'Excellent' deals. 'Poor' deals rarely work out unless you see something special.",
      icon: "🎯"
    },
    {
      category: "Risk Management",
      title: "Keep Reserves",
      description: "Budget 6 months expenses for rentals and 20% contingency for renovations. Murphy's Law applies!",
      icon: "🛡️"
    },
    {
      category: "Fix & Flip",
      title: "70% Rule for Flips",
      description: "Never pay more than 70% of ARV minus renovation costs. Example: $200k ARV - $30k reno = $140k max purchase.",
      icon: "🔄"
    },
    {
      category: "Fix & Flip",
      title: "Timeline Kills Profits",
      description: "Every extra month adds holding costs. Plan 6 months max. Use the renovation timeline to track progress.",
      icon: "⚡"
    },
    {
      category: "Long-Term Rental",
      title: "Screen Tenants Carefully",
      description: "Good tenants are worth paying a property manager. Bad tenants can destroy your ROI quickly.",
      icon: "👥"
    },
    {
      category: "Long-Term Rental",
      title: "Vacancy Allowance",
      description: "Budget 8-10% vacancy even with great tenants. Turnover, repairs, and market changes happen.",
      icon: "📅"
    },
    {
      category: "Short-Term Rental",
      title: "Research Local Laws First",
      description: "Many cities restrict STRs. Check zoning, HOA rules, and permit requirements before buying.",
      icon: "📋"
    },
    {
      category: "Short-Term Rental",
      title: "STR Expenses Add Up",
      description: "Cleaning, restocking, utilities, WiFi, higher insurance, frequent repairs - budget 50-60% of revenue.",
      icon: "🧹"
    },
    {
      category: "Short-Term Rental",
      title: "Seasonality Affects STR",
      description: "Beach areas peak in summer, ski areas in winter. Plan for 30-40% occupancy in off-seasons.",
      icon: "🌊"
    },
    {
      category: "MODA Analysis",
      title: "Customize Your Priorities",
      description: "Adjust the weight sliders! New investors might prioritize lower risk, experienced ones higher ROI.",
      icon: "⚖️"
    },
    {
      category: "MODA Analysis",
      title: "No Perfect Strategy",
      description: "High ROI usually means higher risk or workload. The tool helps you find the best trade-offs for YOU.",
      icon: "🎭"
    },
    {
      category: "Charts & Data",
      title: "Watch the 5-Year Projection",
      description: "Cash flow should grow over time with rent increases. Flat or declining projections are red flags.",
      icon: "📉"
    },
    {
      category: "Charts & Data",
      title: "Compare All Three Strategies",
      description: "Sometimes the 'obvious' choice isn't best. Let the data surprise you - analyze all three options.",
      icon: "🔍"
    },
    {
      category: "Advanced Tips",
      title: "Market Timing Matters",
      description: "Buy in down markets, sell/rent in up markets. This tool shows current scenario - consider cycles.",
      icon: "📊"
    },
    {
      category: "Advanced Tips",
      title: "Scale Your Strategy",
      description: "STR can fund LTR purchases. Flip profits can buy rentals. Think portfolio, not just single properties.",
      icon: "🏢"
    },
    {
      category: "Advanced Tips",
      title: "Professional Network",
      description: "Build relationships with agents, contractors, lenders, and property managers. Good teams make great deals.",
      icon: "🤝"
    },
    {
      category: "Common Mistakes",
      title: "Don't Fall in Love",
      description: "Buy numbers, not emotions. If the deal doesn't work financially, walk away no matter how pretty.",
      icon: "💔"
    },
    {
      category: "Common Mistakes", 
      title: "Verify Rental Rates",
      description: "Call local property managers or check actual listings. Don't trust online estimates blindly.",
      icon: "☎️"
    },
    {
      category: "Common Mistakes",
      title: "Factor All Costs",
      description: "Include closing costs, inspection fees, appraisal, permits, and unexpected repairs in your analysis.",
      icon: "📝"
    }
  ];

  // Show random hint on component mount
  useEffect(() => {
    if (showRandomHint) {
      const timer = setTimeout(() => {
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        setCurrentHint(randomHint);
        setShowHint(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [showRandomHint]);

  const getRandomHint = () => {
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    setCurrentHint(randomHint);
    setShowHint(true);
  };

  const dismissHint = () => {
    setShowHint(false);
    setTimeout(() => setCurrentHint(null), 300);
  };

  // Group hints by category for the all hints view
  const hintsByCategory = hints.reduce((acc, hint) => {
    if (!acc[hint.category]) {
      acc[hint.category] = [];
    }
    acc[hint.category].push(hint);
    return acc;
  }, {});

  if (showAllHints) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Real Estate Investment Tips & Tricks</h2>
                <p className="text-indigo-200 mt-1">Master the tool and improve your investing</p>
              </div>
              <button
                onClick={() => setShowAllHints(false)}
                className="text-indigo-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
            {Object.entries(hintsByCategory).map(([category, categoryHints]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryHints.map((hint, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{hint.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{hint.title}</h4>
                          <p className="text-sm text-gray-600">{hint.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                💡 {hints.length} tips total • Updated regularly with new insights
              </p>
              <button
                onClick={() => setShowAllHints(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Random Hint Popup */}
      {showHint && currentHint && (
        <div className="fixed top-6 right-6 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-40 transform transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{currentHint.icon}</span>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                TIP
              </span>
            </div>
            <button
              onClick={dismissHint}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <h4 className="font-medium text-gray-900 mb-2">{currentHint.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{currentHint.description}</p>
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowAllHints(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View All Tips →
            </button>
            <button
              onClick={getRandomHint}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
            >
              Another Tip
            </button>
          </div>
        </div>
      )}

      {/* Floating Hints Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setShowAllHints(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 transform hover:scale-110"
          title="View Tips & Tricks"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default TutorialHints; 