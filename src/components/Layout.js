import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const navLinks = [
  { to: '/', label: 'Home', key: '1' },
  { to: '/real-estate', label: 'Real Estate', key: '2' },
  { to: '/financial-planning', label: 'Financial Planning', key: '3' },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState({ firstName: '', lastName: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const { user, isAuthenticated, logout, updateProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (!e.altKey) return;
      const link = navLinks.find(l => l.key === e.key);
      if (link) {
        e.preventDefault();
        navigate(link.to);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-terminal-bg terminal-scrollbar">
      <nav className="bg-surface-primary border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <img
                  src={`${process.env.PUBLIC_URL}/Ultronic_Icon.png`}
                  alt=""
                  className="w-8 h-8 rounded object-cover object-[center_30%]"
                />
                <span className="text-terminal-green font-display text-lg font-bold tracking-wide crt-glow">
                  ULTRONIC
                </span>
                <span className="text-txt-secondary font-display text-xs font-medium uppercase tracking-widest hidden sm:inline">
                  Terminal
                </span>
              </Link>

              <div className="hidden sm:flex sm:ml-8 sm:space-x-1">
                {navLinks.map((link) => {
                  const isActive = link.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`
                        inline-flex items-center px-3 py-2 text-xs font-mono uppercase tracking-wider
                        border-b-2 transition-colors duration-200
                        ${isActive
                          ? 'border-terminal-green text-terminal-green'
                          : 'border-transparent text-txt-secondary hover:text-terminal-dim-green hover:border-terminal-dark-green'
                        }
                      `}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-txt-muted text-xs font-mono hidden sm:inline">v0.3.0</span>

              {!authLoading && (
                isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border hover:border-terminal-dark-green transition-colors"
                    >
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-terminal-dark-green flex items-center justify-center">
                          <span className="text-terminal-green text-xs font-bold font-mono">
                            {user?.firstName?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <span className="text-txt-primary text-xs font-mono hidden sm:inline">
                        {user?.firstName || 'User'}
                      </span>
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-64 bg-surface-elevated border border-surface-border rounded-lg shadow-glow-green-sm z-50 py-1">
                          <div className="px-4 py-2 border-b border-surface-border">
                            <p className="text-xs font-mono text-terminal-green truncate">{user?.email}</p>
                            {(user?.firstName || user?.lastName) && (
                              <p className="text-xs font-mono text-txt-secondary mt-0.5">
                                {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setProfileName({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
                              setProfileOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-mono text-txt-secondary hover:text-terminal-cyan hover:bg-surface-overlay transition-colors"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={async () => {
                              setUserMenuOpen(false);
                              await logout();
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-mono text-txt-secondary hover:text-terminal-red hover:bg-surface-overlay transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="glow-btn glow-btn-green px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider"
                  >
                    Sign In
                  </button>
                )
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden text-txt-secondary hover:text-terminal-green p-1"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-surface-border bg-surface-elevated">
            <div className="px-4 py-2 space-y-1">
              {navLinks.map((link) => {
                const isActive = link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-xs font-mono uppercase tracking-wider rounded ${
                      isActive
                        ? 'text-terminal-green bg-terminal-dark-green/20'
                        : 'text-txt-secondary hover:text-terminal-dim-green hover:bg-surface-overlay'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {profileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setProfileOpen(false)} />
          <div className="relative w-full max-w-sm mx-4 terminal-card p-0 overflow-hidden">
            <div className="bg-surface-elevated border-b border-surface-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-display font-bold text-terminal-green crt-glow uppercase tracking-wider text-lg">
                Profile
              </h2>
              <button onClick={() => setProfileOpen(false)} className="text-txt-muted hover:text-terminal-green transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">First Name</label>
                <input
                  type="text"
                  value={profileName.firstName}
                  onChange={(e) => setProfileName(p => ({ ...p, firstName: e.target.value }))}
                  className="terminal-input w-full"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">Last Name</label>
                <input
                  type="text"
                  value={profileName.lastName}
                  onChange={(e) => setProfileName(p => ({ ...p, lastName: e.target.value }))}
                  className="terminal-input w-full"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setProfileOpen(false)}
                  className="flex-1 bg-surface-elevated border border-surface-border py-2 rounded-lg text-xs font-mono uppercase text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={profileSaving}
                  onClick={async () => {
                    setProfileSaving(true);
                    try {
                      await updateProfile(profileName);
                      setProfileOpen(false);
                    } catch { }
                    setProfileSaving(false);
                  }}
                  className="flex-1 glow-btn glow-btn-green py-2 rounded-lg text-xs font-mono uppercase disabled:opacity-40 transition-all"
                >
                  {profileSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-surface-primary border-t border-surface-border">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-txt-muted text-xs font-mono">
            ULTRONIC TERMINAL &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
