import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Interface Render Recovery</h2>
            <p className="text-xs text-slate-300">
              An unexpected render anomaly occurred. Click below to reload the real-time command dashboard.
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-red-400 font-mono text-left max-h-24 overflow-y-auto">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 mx-auto shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Command Center</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
