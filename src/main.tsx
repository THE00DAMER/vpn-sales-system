import React, {StrictMode, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', background: '#09090b', color: '#f4f4f5', fontFamily: 'monospace', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%', padding: '24px', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <h2 style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>⚠️ Something went wrong / خطایی رخ داده است</h2>
            <p style={{ color: '#a1a1aa', fontSize: '13px', marginBottom: '20px' }}>
              The application encountered a client-side JavaScript crash. Below are the details:
            </p>
            <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #27272a', overflowX: 'auto', marginBottom: '24px' }}>
              <p style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{this.state.error?.toString()}</p>
              <pre style={{ fontSize: '11px', color: '#71717a', margin: 0, whiteSpace: 'pre-wrap' }}>{this.state.errorInfo?.componentStack}</pre>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              style={{ width: '100%', padding: '10px', background: '#10b981', color: '#09090b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            >
              Reload Page (تلاش مجدد)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

