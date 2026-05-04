import React, { createContext, useContext, useReducer } from 'react';

const RealEstateContext = createContext(null);

const DEFAULT_FORM_DATA = {
  purchasePrice: '485000',
  renovationCost: '',
  expectedSellingPrice: '700000',
  expectedMonthlyRent: '4500',
  holdingPeriod: '6',
  downPayment: '20',
  interestRate: '7',
  loanTerm: '30',
  propertyTax: '1.2',
  insurance: '0.5',
  maintenance: '0.5',
  vacancyRate: '5',
  closingCosts: '2',
  sellingCosts: '6',
  propertyManagement: '10',
  squareFootage: '2000',
  propertyCondition: 'fair',
  state: 'FL',
  diyLevel: 'some',
  location: '',
  nightlyRate: '',
  occupancyRate: '65',
  strManagement: '20',
};

function realEstateReducer(state, action) {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };

    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: { ...state.formData, [action.payload.field]: action.payload.value },
      };

    case 'SET_RESULTS':
      return { ...state, results: action.payload };

    case 'CLEAR':
      return { formData: DEFAULT_FORM_DATA, results: null };

    default:
      return state;
  }
}

export function RealEstateProvider({ children }) {
  const [state, dispatch] = useReducer(realEstateReducer, {
    formData: DEFAULT_FORM_DATA,
    results: null,
  });

  const contextValue = React.useMemo(() => ({ state, dispatch }), [state]);

  return (
    <RealEstateContext.Provider value={contextValue}>
      {children}
    </RealEstateContext.Provider>
  );
}

export function useRealEstate() {
  const context = useContext(RealEstateContext);
  if (!context) {
    throw new Error('useRealEstate must be used within a RealEstateProvider');
  }
  return context;
}

export { DEFAULT_FORM_DATA };
