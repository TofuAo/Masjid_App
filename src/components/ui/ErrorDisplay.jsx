import React from 'react';
import Card from './Card';
import Button from './Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { isAdmin } from '../../utils/errorLogger';

/**
 * Reusable error display component for pages
 * Shows user-friendly error messages with admin debugging details
 */
const ErrorDisplay = ({ 
  error, 
  title = 'Ralat Memuatkan Data',
  onRetry, 
  onReload,
  showHomeButton = false,
  className = '' 
}) => {
  if (!error) return null;

  const adminMode = isAdmin();
  const errorMessage = error.message || 'Ralat tidak dijangka berlaku.';
  const adminDetails = error.adminDetails || error.originalError;

  return (
    <div className={`text-center py-12 ${className}`}>
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-red-600 mb-4">{errorMessage}</p>
        
        {/* Admin debugging details */}
        {adminMode && adminDetails && (
          <details className="mb-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer mb-2 hover:text-gray-700">
              Butiran Ralat (Pentadbir)
            </summary>
            <div className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48 mt-2">
              <div className="space-y-2">
                {adminDetails.message && (
                  <div>
                    <strong className="text-gray-700">Mesej:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-gray-800">{adminDetails.message}</pre>
                  </div>
                )}
                {adminDetails.status && (
                  <div>
                    <strong className="text-gray-700">Status Kod:</strong> {adminDetails.status}
                  </div>
                )}
                {adminDetails.url && (
                  <div>
                    <strong className="text-gray-700">URL:</strong> {adminDetails.url}
                  </div>
                )}
                {adminDetails.method && (
                  <div>
                    <strong className="text-gray-700">Kaedah:</strong> {adminDetails.method}
                  </div>
                )}
                {adminDetails.data && (
                  <div>
                    <strong className="text-gray-700">Data Respons:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-gray-800">
                      {JSON.stringify(adminDetails.data, null, 2)}
                    </pre>
                  </div>
                )}
                {adminDetails.stack && (
                  <div>
                    <strong className="text-gray-700">Stack Trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-gray-800 text-xs">
                      {adminDetails.stack}
                    </pre>
                  </div>
                )}
                {!adminDetails.message && !adminDetails.status && (
                  <pre className="whitespace-pre-wrap text-gray-800">
                    {JSON.stringify(adminDetails, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Cuba Lagi
            </Button>
          )}
          {onReload !== false && (
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Semula Halaman
            </Button>
          )}
          {showHomeButton && (
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Halaman Utama
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ErrorDisplay;
