import React, { useState, useEffect } from 'react';

const hints = [
    {
      category: "Getting Started",
      title: "Start with Realistic Numbers",
      description: "Enter actual market values for your area. Use Zillow, Realtor.com, or recent sales for purchase prices.",
    },
    {
      category: "Getting Started",
      title: "Property Condition Matters",
      description: "Select the correct condition — it affects renovation costs by 100%+. 'Fair' means cosmetic work, 'Poor' needs major repairs.",
    },
    {
      category: "Strategy Selection",
      title: "Location Drives Strategy",
      description: "Tourist areas favor STR, family neighborhoods favor LTR, and emerging areas favor Fix & Flip.",
    },
    {
      category: "Strategy Selection",
      title: "Consider Your Time",
      description: "STR requires daily management, LTR needs monthly oversight, Fix & Flip is intense then done.",
    },
    {
      category: "Financial Analysis",
      title: "Cash Flow is King",
      description: "Positive cash flow of $200+/month for rentals is ideal. Negative cash flow means you pay monthly.",
    },
    {
      category: "Financial Analysis",
      title: "The 1% Rule",
      description: "Monthly rent should equal 1% of purchase price. Getting harder to find but still a good benchmark.",
    },
    {
      category: "Financial Analysis",
      title: "Total ROI vs Cash-on-Cash",
      description: "Total ROI includes appreciation and principal paydown — much more accurate than cash-on-cash alone.",
    },
    {
      category: "Risk Management",
      title: "Stress Test with Sliders",
      description: "Use sensitivity sliders to test worst-case scenarios. What if rent drops 20% or vacancy hits 15%?",
    },
    {
      category: "Risk Management",
      title: "Deal Quality Grades Matter",
      description: "Focus on 'Good' or 'Excellent' deals. 'Poor' deals rarely work out unless you see something special.",
    },
    {
      category: "Risk Management",
      title: "Keep Reserves",
      description: "Budget 6 months expenses for rentals and 20% contingency for renovations.",
    },
    {
      category: "Fix & Flip",
      title: "70% Rule for Flips",
      description: "Never pay more than 70% of ARV minus renovation costs. Example: $200k ARV - $30k reno = $140k max purchase.",
    },
    {
      category: "Fix & Flip",
      title: "Timeline Kills Profits",
      description: "Every extra month adds holding costs. Plan 6 months max. Use the renovation timeline to track progress.",
    },
    {
      category: "Long-Term Rental",
      title: "Screen Tenants Carefully",
      description: "Good tenants are worth paying a property manager. Bad tenants can destroy your ROI quickly.",
    },
    {
      category: "Long-Term Rental",
      title: "Vacancy Allowance",
      description: "Budget 8–10% vacancy even with great tenants. Turnover, repairs, and market changes happen.",
    },
    {
      category: "Short-Term Rental",
      title: "Research Local Laws First",
      description: "Many cities restrict STRs. Check zoning, HOA rules, and permit requirements before buying.",
    },
    {
      category: "Short-Term Rental",
      title: "STR Expenses Add Up",
      description: "Cleaning, restocking, utilities, WiFi, higher insurance, frequent repairs — budget 50–60% of revenue.",
    },
    {
      category: "Short-Term Rental",
      title: "Seasonality Affects STR",
      description: "Beach areas peak in summer, ski areas in winter. Plan for 30–40% occupancy in off-seasons.",
    },
    {
      category: "MODA Analysis",
      title: "Customize Your Priorities",
      description: "Adjust the weight sliders. New investors might prioritize lower risk, experienced ones higher ROI.",
    },
    {
      category: "MODA Analysis",
      title: "No Perfect Strategy",
      description: "High ROI usually means higher risk or workload. The tool helps you find the best trade-offs for you.",
    },
    {
      category: "Charts & Data",
      title: "Watch the 5-Year Projection",
      description: "Cash flow should grow over time with rent increases. Flat or declining projections are red flags.",
    },
    {
      category: "Charts & Data",
      title: "Compare All Three Strategies",
      description: "Sometimes the 'obvious' choice isn't best. Let the data surprise you — analyze all three options.",
    },
    {
      category: "Advanced Tips",
      title: "Market Timing Matters",
      description: "Buy in down markets, sell/rent in up markets. This tool shows current scenario — consider cycles.",
    },
    {
      category: "Advanced Tips",
      title: "Scale Your Strategy",
      description: "STR can fund LTR purchases. Flip profits can buy rentals. Think portfolio, not just single properties.",
    },
    {
      category: "Advanced Tips",
      title: "Professional Network",
      description: "Build relationships with agents, contractors, lenders, and property managers. Good teams make great deals.",
    },
    {
      category: "Common Mistakes",
      title: "Don't Fall in Love",
      description: "Buy numbers, not emotions. If the deal doesn't work financially, walk away no matter how pretty.",
    },
    {
      category: "Common Mistakes",
      title: "Verify Rental Rates",
      description: "Call local property managers or check actual listings. Don't trust online estimates blindly.",
    },
    {
      category: "Common Mistakes",
      title: "Factor All Costs",
      description: "Include closing costs, inspection fees, appraisal, permits, and unexpected repairs in your analysis.",
    }
];

const CATEGORY_COLORS = {
  "Getting Started": "text-terminal-green",
  "Strategy Selection": "text-terminal-cyan",
  "Financial Analysis": "text-terminal-amber",
  "Risk Management": "text-terminal-red",
  "Fix & Flip": "text-terminal-cyan",
  "Long-Term Rental": "text-terminal-green",
  "Short-Term Rental": "text-terminal-amber",
  "MODA Analysis": "text-terminal-cyan",
  "Charts & Data": "text-terminal-green",
  "Advanced Tips": "text-terminal-amber",
  "Common Mistakes": "text-terminal-red",
};

const DISMISSED_KEY = 'ultronic_tips_dismissed';

const TutorialHints = () => {
  const [currentHint, setCurrentHint] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showAllHints, setShowAllHints] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => {
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        setCurrentHint(randomHint);
        setShowHint(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const getRandomHint = () => {
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    setCurrentHint(randomHint);
    setShowHint(true);
  };

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem(DISMISSED_KEY, '1');
    setTimeout(() => setCurrentHint(null), 300);
  };

  const hintsByCategory = hints.reduce((acc, hint) => {
    if (!acc[hint.category]) acc[hint.category] = [];
    acc[hint.category].push(hint);
    return acc;
  }, {});

  if (showAllHints) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="terminal-card p-0 max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="bg-surface-elevated px-6 py-4 border-b border-surface-border flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-terminal-green crt-glow uppercase tracking-wider text-lg">
                Real Estate Tips & Tricks
              </h2>
              <p className="text-txt-muted font-mono text-xs mt-1">
                {hints.length} entries — investment analysis guidance
              </p>
            </div>
            <button
              onClick={() => setShowAllHints(false)}
              className="text-txt-muted hover:text-terminal-green transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 terminal-scrollbar">
            {Object.entries(hintsByCategory).map(([category, categoryHints]) => (
              <div key={category} className="mb-6">
                <h3 className={`font-display font-bold uppercase tracking-wider text-xs mb-3 pb-2 border-b border-surface-border ${CATEGORY_COLORS[category] || 'text-terminal-green'}`}>
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryHints.map((hint, index) => (
                    <div key={index} className="bg-surface-elevated rounded-lg p-3 border border-surface-border hover:border-terminal-dark-green transition-colors">
                      <h4 className="font-mono font-medium text-sm text-terminal-cyan mb-1">{hint.title}</h4>
                      <p className="font-mono text-xs text-txt-secondary leading-relaxed">{hint.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface-elevated px-6 py-3 border-t border-surface-border flex justify-end">
            <button
              onClick={() => setShowAllHints(false)}
              className="glow-btn glow-btn-green px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showHint && currentHint && (
        <div className="fixed top-16 right-4 terminal-card p-0 max-w-xs z-40 shadow-glow-green-sm overflow-hidden">
          <div className="bg-surface-elevated px-3 py-2 border-b border-surface-border flex items-center justify-between">
            <span className={`font-display font-bold uppercase tracking-wider text-[10px] ${CATEGORY_COLORS[currentHint.category] || 'text-terminal-amber'}`}>
              {currentHint.category}
            </span>
            <button
              onClick={dismissHint}
              className="text-txt-muted hover:text-terminal-green transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3">
            <h4 className="font-mono font-medium text-sm text-terminal-cyan mb-1">{currentHint.title}</h4>
            <p className="font-mono text-xs text-txt-secondary leading-relaxed">{currentHint.description}</p>
          </div>

          <div className="px-3 pb-3 flex justify-between items-center">
            <button
              onClick={() => setShowAllHints(true)}
              className="text-[10px] font-mono uppercase tracking-wider text-txt-muted hover:text-terminal-green transition-colors"
            >
              View all tips
            </button>
            <button
              onClick={getRandomHint}
              className="text-[10px] font-mono uppercase tracking-wider bg-surface-elevated border border-surface-border hover:border-terminal-dark-green text-txt-secondary hover:text-terminal-cyan px-2 py-1 rounded transition-colors"
            >
              Next tip
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setShowAllHints(true)}
          className="bg-surface-elevated border border-terminal-dark-green hover:border-terminal-green text-terminal-green rounded-full p-3 transition-all duration-200 hover:shadow-glow-green-sm group"
          title="View Tips & Tricks"
        >
          <svg className="w-5 h-5 group-hover:drop-shadow-[0_0_6px_var(--terminal-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default TutorialHints;
