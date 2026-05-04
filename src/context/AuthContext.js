import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/api';

const AuthContext = createContext(null);

function mapUser(supabaseUser) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  let firstName = meta.first_name || '';
  let lastName = meta.last_name || '';
  if (!firstName && meta.full_name) {
    const parts = meta.full_name.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }
  if (!firstName && meta.name) {
    const parts = meta.name.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    firstName,
    lastName,
    avatarUrl: meta.avatar_url || meta.picture || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sessionRef = useRef(null);

  const isAuthenticated = !!session;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      sessionRef.current = s;
      setUser(mapUser(s?.user ?? null));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      sessionRef.current = s;
      setUser(mapUser(s?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured.');
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      throw err;
    }
    return mapUser(data.user);
  }, []);

  const register = useCallback(async ({ firstName, lastName, email, password }) => {
    if (!supabase) throw new Error('Supabase not configured.');
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    if (err) {
      setError(err.message);
      throw err;
    }
    return mapUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    sessionRef.current = null;
  }, []);

  const loadFinancialData = useCallback(async () => {
    const s = sessionRef.current;
    if (!supabase || !s) return null;
    const { data, error: err } = await supabase
      .from('financial_data')
      .select('data')
      .eq('user_id', s.user.id)
      .maybeSingle();
    if (err) throw err;
    return data?.data || null;
  }, []);

  const saveFinancialData = useCallback(async (financialData) => {
    const s = sessionRef.current;
    if (!supabase || !s) return;
    const { error: err } = await supabase
      .from('financial_data')
      .upsert({ user_id: s.user.id, data: financialData });
    if (err) throw err;
  }, []);

  const updateProfile = useCallback(async ({ firstName, lastName }) => {
    if (!supabase) return;
    const { data, error: err } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    });
    if (err) throw err;
    setUser(mapUser(data.user));
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    loadFinancialData,
    saveFinancialData,
    updateProfile,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
