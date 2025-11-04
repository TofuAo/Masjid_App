import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ onClick, className = '', variant = 'default' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1); // Go back in browser history
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

