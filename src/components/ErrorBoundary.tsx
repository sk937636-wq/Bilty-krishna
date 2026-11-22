import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    errorMessage: '',
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'Unknown error' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Caught by Boundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch (_) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h1 className="text-lg font-bold text-white">App Reload Required</h1>
            <p className="text-xs text-slate-400">
              Transport Bilty application ko dobara shuru karne ke liye niche diye gaye button par click karein:
            </p>
            {this.state.errorMessage && (
              <pre className="text-[11px] bg-slate-950 p-2.5 rounded-lg text-rose-300 font-mono text-left overflow-x-auto max-h-28">
                {this.state.errorMessage}
              </pre>
            )}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-colors cursor-pointer"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Clear Cache &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
