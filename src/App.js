import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import UltronicThemeProvider from './theme/UltronicThemeProvider';
import Layout from './components/Layout';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import Results from './pages/Results';
import FinancialPlanningHub from './pages/FinancialPlanningHub';
import ChatbotWidget from './components/ChatbotWidget';
import TutorialHints from './components/TutorialHints';
import ErrorBoundary from './components/common/ErrorBoundary';

const FinancialProfileSection = lazy(() => import('./components/planning/FinancialProfileSection'));
const AccumulateSection = lazy(() => import('./components/planning/AccumulateSection'));
const SpendDownSection = lazy(() => import('./components/planning/SpendDownSection'));
const AdvancedRetirementSection = lazy(() => import('./components/planning/AdvancedRetirementSection'));
const ReportsSection = lazy(() => import('./components/planning/ReportsSection'));

const PageLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terminal-green"></div>
  </div>
);

function App() {
  return (
    <AppProvider>
      <UltronicThemeProvider>
        <Router>
          <Layout>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/real-estate" element={<Calculator />} />
                  <Route path="/results" element={<Results />} />

                  {/* Financial Planning Hub */}
                  <Route path="/financial-planning" element={<FinancialPlanningHub />}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<FinancialProfileSection />} />
                    <Route path="accumulate" element={<AccumulateSection />} />
                    <Route path="spend-down" element={<SpendDownSection />} />
                    <Route path="advanced" element={<AdvancedRetirementSection />} />
                    <Route path="reports" element={<ReportsSection />} />
                  </Route>

                  {/* Redirects from old routes */}
                  <Route path="/finance" element={<Navigate to="/financial-planning/accumulate" replace />} />
                  <Route path="/accumulate" element={<Navigate to="/financial-planning/accumulate" replace />} />
                  <Route path="/spend-down" element={<Navigate to="/financial-planning/spend-down" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>

            <ChatbotWidget />
            <TutorialHints showRandomHint={true} />
          </Layout>
        </Router>
      </UltronicThemeProvider>
    </AppProvider>
  );
}

export default App;
