import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import PlanningHubSidebar from '../components/planning/PlanningHubSidebar';

const PageLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terminal-green"></div>
  </div>
);

export default function FinancialPlanningHub() {
  return (
    <div className="min-h-screen bg-terminal-bg">
      <div className="max-w-full mx-auto flex flex-col lg:flex-row">
        <PlanningHubSidebar />
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 overflow-x-hidden">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
