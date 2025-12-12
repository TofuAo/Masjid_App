import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ onClick, className = '', variant = 'default', fallbackPath = '/' }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else {
      // Try to go back in browser history
      // React Router's navigate(-1) will go back if history exists
      // If no history, it will stay on current page, so we provide a fallback
      const hasHistory = window.history.length > 1;
      
      if (hasHistory) {
        navigate(-1);
      } else {
        // Fallback to home/dashboard if no history available
        navigate(fallbackPath, { replace: true });
      }
    }
  };

  const baseClasses = 'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Kembali
    </button>
  );
};

export default BackButton;

