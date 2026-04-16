import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { globalEventsAPI } from '../../services/api';

/**
 * Global 5-day calendar bar for "Hari Konvo" and other events.
 * Displays below the top bar, visible on all pages.
 */
const HariKonvoDateBar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ start_date: '', end_date: '' });

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    // Default: 5-day strip 22-26 of current month (per spec)
    const start = new Date(year, month, 22);
    const end = new Date(year, month, 26);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    globalEventsAPI
      .list({ start_date: startStr, end_date: endStr })
      .then((res) => {
        if (res?.data?.data) {
          setEvents(res.data.data);
          setRange(res.data.range || { start_date: startStr, end_date: endStr });
        }
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const getDaysInRange = () => {
    if (!range.start_date || !range.end_date) return [];
    const days = [];
    const start = new Date(range.start_date);
    const end = new Date(range.end_date);
    const d = new Date(start);
    while (d <= end) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInRange();
  const eventsByDate = events.reduce((acc, e) => {
    const d = e.event_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});
  // Add "Hari Konvo" on 24th if that date is in range and no event exists
  days.forEach((d) => {
    const ds = d.toISOString().split('T')[0];
    const dayNum = d.getDate();
    if (dayNum === 24 && !eventsByDate[ds]?.length) {
      eventsByDate[ds] = [{ label: 'Hari Konvo', event_date: ds }];
    }
  });

  const formatDay = (date) => {
    return date.getDate();
  };
  const formatLabel = (date) => {
    const opts = { weekday: 'short' };
    return date.toLocaleDateString('ms-MY', opts).slice(0, 2);
  };

  if (loading && days.length === 0) {
    return (
      <div className="h-12 bg-emerald-50 border-b border-emerald-100 flex items-center justify-center">
        <div className="animate-pulse h-6 w-48 bg-emerald-200 rounded" />
      </div>
    );
  }

  return (
    <div className="h-12 bg-emerald-50 border-b border-emerald-100 flex items-center px-4 gap-2 overflow-x-auto">
      <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {days.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayEvents = eventsByDate[dateStr] || [];
          const label = dayEvents[0]?.label || (date.getDate() === new Date().getDate() ? 'Hari Ini' : '');
          const isToday =
            date.toDateString() === new Date().toDateString();

          return (
            <div
              key={dateStr}
              className={`
                flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-lg flex-shrink-0
                ${isToday ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-gray-700'}
              `}
            >
              <span className="text-[10px] uppercase font-medium opacity-80">
                {formatLabel(date)}
              </span>
              <span className="text-lg font-bold">{formatDay(date)}</span>
              {label && (
                <span className="text-[10px] truncate max-w-full" title={label}>
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HariKonvoDateBar;
