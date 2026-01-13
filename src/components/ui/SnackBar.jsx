import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * SnackBar Context for global snackbar management
 */
const SnackBarContext = createContext();

export const useSnackBar = () => {
  const context = useContext(SnackBarContext);
  if (!context) {
    throw new Error('useSnackBar must be used within SnackBarProvider');
  }
  return context;
};

/**
 * SnackBar Provider Component
 * Wrap your app with this to enable global snackbar functionality
 */
export const SnackBarProvider = ({ children }) => {
  const [snackbars, setSnackbars] = useState([]);

  const showSnackBar = (message, options = {}) => {
    const id = Date.now() + Math.random();
    const snackbar = {
      id,
      message,
      variant: options.variant || 'info',
      duration: options.duration || 4000,
      position: options.position || 'bottom-right',
      action: options.action,
      onClose: options.onClose,
    };

    setSnackbars((prev) => [...prev, snackbar]);

    // Auto dismiss
    if (snackbar.duration > 0) {
      setTimeout(() => {
        removeSnackBar(id);
      }, snackbar.duration);
    }

    return id;
  };

  const removeSnackBar = (id) => {
    setSnackbars((prev) => prev.filter((sb) => sb.id !== id));
  };

  const success = (message, options) => showSnackBar(message, { ...options, variant: 'success' });
  const error = (message, options) => showSnackBar(message, { ...options, variant: 'error' });
  const warning = (message, options) => showSnackBar(message, { ...options, variant: 'warning' });
  const info = (message, options) => showSnackBar(message, { ...options, variant: 'info' });

  return (
    <SnackBarContext.Provider value={{ showSnackBar, success, error, warning, info, removeSnackBar }}>
      {children}
      <SnackBarContainer snackbars={snackbars} removeSnackBar={removeSnackBar} />
    </SnackBarContext.Provider>
  );
};

/**
 * SnackBar Container - Renders all snackbars
 */
const SnackBarContainer = ({ snackbars, removeSnackBar }) => {
  const positions = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  const groupedSnackbars = snackbars.reduce((acc, sb) => {
    if (!acc[sb.position]) acc[sb.position] = [];
    acc[sb.position].push(sb);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedSnackbars).map(([position, items]) => (
        <div
          key={position}
          className={`fixed z-50 flex flex-col gap-2 ${positions[position] || positions['bottom-right']}`}
        >
          {items.map((snackbar) => (
            <SnackBarItem
              key={snackbar.id}
              snackbar={snackbar}
              onClose={() => removeSnackBar(snackbar.id)}
            />
          ))}
        </div>
      ))}
    </>
  );
};

/**
 * Individual SnackBar Item
 */
const SnackBarItem = ({ snackbar, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const variants = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const variant = variants[snackbar.variant] || variants.info;
  const Icon = variant.icon;

  return (
    <div
      className={`
        ${variant.bg} ${variant.border} ${variant.text}
        border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md
        flex items-start gap-3
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
      role="alert"
    >
      <Icon className={`w-5 h-5 ${variant.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{snackbar.message}</p>
        {snackbar.action && (
          <div className="mt-2">
            {snackbar.action}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className={`
          ${variant.text} hover:opacity-70
          flex-shrink-0 p-1 rounded transition-opacity
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
        `}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Standalone SnackBar Component (for one-off use)
 */
const SnackBar = ({ 
  message, 
  variant = 'info', 
  open, 
  onClose, 
  duration = 4000,
  position = 'bottom-right',
  action,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300); // Wait for animation
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  const variants = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const variantStyle = variants[variant] || variants.info;
  const Icon = variantStyle.icon;

  const positions = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={`
        fixed z-50 ${positions[position]}
        ${variantStyle.bg} ${variantStyle.border} ${variantStyle.text}
        border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md
        flex items-start gap-3
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        ${className}
      `}
      role="alert"
    >
      <Icon className={`w-5 h-5 ${variantStyle.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{message}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className={`
          ${variantStyle.text} hover:opacity-70
          flex-shrink-0 p-1 rounded transition-opacity
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
        `}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SnackBar;
