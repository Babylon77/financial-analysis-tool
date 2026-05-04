import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const switchMode = (newMode) => {
    setMode(newMode);
    setLocalError('');
    clearError();
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        });
      }
      onClose();
    } catch {
      // error is already set in context
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 terminal-card p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-surface-elevated border-b border-surface-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-terminal-green crt-glow uppercase tracking-wider text-lg">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-txt-muted hover:text-terminal-green transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-surface-border">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
              mode === 'login'
                ? 'text-terminal-green border-b-2 border-terminal-green bg-surface-elevated'
                : 'text-txt-muted hover:text-txt-secondary'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
              mode === 'register'
                ? 'text-terminal-green border-b-2 border-terminal-green bg-surface-elevated'
                : 'text-txt-muted hover:text-txt-secondary'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {displayError && (
            <div className="bg-terminal-red/10 border border-terminal-red/30 rounded-lg px-4 py-3">
              <p className="text-terminal-red text-sm font-mono">{displayError}</p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={async () => {
              if (!supabase) return;
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
              });
            }}
            className="w-full flex items-center justify-center gap-3 bg-surface-elevated border border-surface-border hover:border-terminal-dim-green py-3 rounded-lg font-mono text-sm text-txt-primary transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-surface-border"></div>
            <span className="text-xs text-txt-muted font-mono uppercase">or</span>
            <div className="flex-1 border-t border-surface-border"></div>
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                  First Name
                </label>
                <input
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                  Last Name
                </label>
                <input
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="terminal-input w-full"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="terminal-input w-full"
              placeholder="Min 8 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="terminal-input w-full"
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full glow-btn glow-btn-green py-3 rounded-lg font-mono uppercase tracking-wider text-sm disabled:opacity-40 transition-all"
          >
            {submitting
              ? 'Processing...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>

          <p className="text-center text-xs text-txt-muted font-mono">
            {mode === 'login' ? (
              <>No account? <button type="button" onClick={() => switchMode('register')} className="text-terminal-cyan hover:underline">Register</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => switchMode('login')} className="text-terminal-cyan hover:underline">Sign In</button></>
            )}
          </p>
        </form>

        {/* Guest hint */}
        <div className="border-t border-surface-border px-6 py-3 bg-surface-elevated">
          <p className="text-xs text-txt-muted font-mono text-center">
            Or continue as guest — your data stays in this browser session only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
