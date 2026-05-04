import React, { createContext, useContext, useReducer } from 'react';

const UserPreferencesContext = createContext(null);

const DEFAULT_PREFERENCES = {
  sidebarCollapsed: false,
  showTutorialHints: true,
  showChatbot: true,
};

function preferencesReducer(state, action) {
  switch (action.type) {
    case 'SET_PREFERENCE':
      return { ...state, [action.payload.key]: action.payload.value };

    case 'TOGGLE_PREFERENCE':
      return { ...state, [action.payload]: !state[action.payload] };

    default:
      return state;
  }
}

export function UserPreferencesProvider({ children }) {
  const [state, dispatch] = useReducer(preferencesReducer, DEFAULT_PREFERENCES);

  const contextValue = React.useMemo(() => ({ state, dispatch }), [state]);

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
