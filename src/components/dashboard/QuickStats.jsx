import React from 'react';
import StatCard from './StatCard';
import { TrendingUp, TrendingDown, Users, BookOpen } from 'lucide-react';

const QuickStats = () => {
  const stats = [
    {
      title: 'Kehadiran Hari Ini',
      value: '85%',
      change: '+5% dari semalam',
      changeType: 'positive',
      icon: <TrendingUp />
    },
    {
      title: 'Yuran Tertunggak',
      value: '12',
      change: '-3 dari minggu lepas',
      changeType: 'positive',
      icon: <TrendingDown />
    },
    {
      title: 'Kelas Aktif',
      value: '8',
      change: 'Semua berjalan lancar',
      changeType: 'neutral',
      icon: <BookOpen />
    },
    {
      title: 'Pelajar Baru',
      value: '5',
      change: 'Bulan ini',
      changeType: 'positive',
      icon: <Users />
    }
  ];

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
