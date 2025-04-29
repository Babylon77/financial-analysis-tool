import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Smart Money Moves</span>
            <span className="block text-indigo-600">Your Financial Future</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Make informed decisions about your real estate investments and personal finance with our suite of powerful calculators.
          </p>
        </div>

        <div className="mt-10 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Link
              to="/real-estate"
              className="flex flex-col items-center p-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex-shrink-0">
                <svg className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Real Estate</h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Calculate potential returns on real estate investments and analyze property deals.
              </p>
            </Link>

            <Link
              to="/finance"
              className="flex flex-col items-center p-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex-shrink-0">
                <svg className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Finance</h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Plan your financial future with our comprehensive financial calculators.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 