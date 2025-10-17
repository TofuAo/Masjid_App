import React from 'react';

const StatCard = ({ title, value, icon, change, changeType = 'neutral', className = '' }) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-mosque-neutral-500'
  };

  return (
    <div className={`mosque-card p-6 flex items-center justify-between card-hover-lift ${className}`}>
      <div className="flex-1">
        <p className="text-sm font-medium text-mosque-neutral-600">{title}</p>
        <p className="text-3xl font-bold text-mosque-primary-800 mt-1">{value}</p>
        {change && (
          <p className={`text-sm mt-2 font-medium ${changeColors[changeType]}`}>
            {change}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <div className="w-14 h-14 bg-mosque-primary-100 rounded-full flex items-center justify-center text-mosque-primary-600">
          {React.cloneElement(icon, { size: 28 })}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
