import React from 'react';
import { AuthProvider } from './AuthContext';
import { FinancialPlanProvider } from './FinancialPlanContext';
import { RealEstateProvider } from './RealEstateContext';
import { UserPreferencesProvider } from './UserPreferencesContext';

export function AppProvider({ children }) {
  return (
    <AuthProvider>
      <UserPreferencesProvider>
        <RealEstateProvider>
          <FinancialPlanProvider>
            {children}
          </FinancialPlanProvider>
        </RealEstateProvider>
      </UserPreferencesProvider>
    </AuthProvider>
  );
}
