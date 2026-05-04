import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="terminal-card p-8 max-w-md text-center">
            <div className="text-terminal-red text-4xl mb-4">!</div>
            <h2 className="text-lg font-display font-bold text-terminal-red uppercase tracking-wider mb-2">
              System Error
            </h2>
            <p className="text-txt-secondary text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="glow-btn glow-btn-amber px-4 py-2 text-sm font-mono rounded"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
