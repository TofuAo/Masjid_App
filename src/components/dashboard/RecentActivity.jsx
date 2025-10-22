import React from 'react';
import { Clock, User, BookOpen, Calendar } from 'lucide-react';

const RecentActivity = ({ activities = [] }) => {
  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100">
        <h3 className="text-xl font-bold text-mosque-primary-800">Aktiviti Terkini</h3>
      </div>
      <div className="p-6 space-y-6">
        {activities.length === 0 ? (
          <div className="text-gray-400 text-center py-2">Tiada aktiviti terkini untuk dipaparkan.</div>
        ) : (
          activities.map((activity) => (
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
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
