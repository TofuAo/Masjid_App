import React from 'react';
import { Clock, User, BookOpen, Calendar } from 'lucide-react';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'pelajar',
      message: 'Pelajar baru Ahmad Ali mendaftar',
      time: '10 minit lalu',
      icon: <User size={16} />,
      badgeClass: 'badge-community'
    },
    {
      id: 2,
      type: 'kelas',
      message: 'Kelas Al-Quran dimulakan',
      time: '30 minit lalu',
      icon: <BookOpen size={16} />,
      badgeClass: 'badge-education'
    },
    {
      id: 3,
      type: 'kehadiran',
      message: '25 pelajar hadir untuk kelas Fardhu Ain',
      time: '1 jam lalu',
      icon: <Calendar size={16} />,
      badgeClass: 'badge-family'
    },
    {
      id: 4,
      type: 'yuran',
      message: 'Pembayaran yuran bulanan diterima',
      time: '2 jam lalu',
      icon: <Clock size={16} />,
      badgeClass: 'badge-prayer'
    }
  ];

  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100">
        <h3 className="text-xl font-bold text-mosque-primary-800">Aktiviti Terkini</h3>
      </div>
      <div className="p-6 space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-mosque-primary-100 rounded-full flex items-center justify-center text-mosque-primary-600">
                {activity.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mosque-neutral-800">{activity.message}</p>
              <div className="flex items-center mt-1 space-x-3">
                <span className={`${activity.badgeClass} capitalize`}>
                  {activity.type}
                </span>
                <span className="text-xs text-mosque-neutral-500">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
