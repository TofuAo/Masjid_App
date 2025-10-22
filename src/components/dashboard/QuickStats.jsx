import React from 'react';
import StatCard from './StatCard';

const QuickStats = ({ stats }) => {
  if (!stats || stats.length === 0) {
    return <div className="text-center text-gray-400 py-4">Tiada statistik untuk dipaparkan.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          change={stat.change}
          changeType={stat.changeType}
        />
      ))}
    </div>
  );
};

export default QuickStats;
