import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Sesuatu telah berlaku
        </h2>
        <p className="text-gray-600 mb-6">
          Maaf, berlaku ralat yang tidak dijangka. Sila cuba muat semula halaman atau kembali ke halaman utama.
        </p>
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mb-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer mb-2">
              Butiran ralat (untuk pembangunan)
            </summary>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {error.toString()}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Semula
          </button>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Halaman Utama
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
