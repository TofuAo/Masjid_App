import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'

// Global error handlers for unhandled promise rejections and window errors
// Error boundaries don't catch these, so we need global handlers
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error || event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
  // TODO: In production, send to error logging service
  // logErrorToService(event.error, { type: 'window_error', ...event });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // TODO: In production, send to error logging service
  // logErrorToService(event.reason, { type: 'unhandled_promise_rejection' });
  
  // Prevent default browser console error (optional)
  // event.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>,
)
