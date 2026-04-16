import React, { useState, useEffect } from 'react';
import { campusLifeAPI } from '../services/api';
import { Calendar, FileText, BookOpen, Building2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'takwim', label: 'Takwim', icon: Calendar },
  { id: 'garis_panduan', label: 'Garis Panduan', icon: FileText },
  { id: 'modul', label: 'Modul', icon: BookOpen },
  { id: 'fasiliti', label: 'Fasiliti', icon: Building2 },
];

/** Campus Life - Display only (read-only) for students/staff */
const CampusLifeDisplay = () => {
  const [activeTab, setActiveTab] = useState('takwim');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    campusLifeAPI
      .list({ status: 'approved', category: activeTab })
      .then((res) => {
        const list = res?.data?.data ?? res?.data ?? [];
        setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f9fafb' }}>
          Campus Life
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
          Maklumat pusat - paparan sahaja
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === cat.id
                  ? 'bg-[#16a34a] text-white'
                  : 'bg-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="fm-card">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: '#1f2937' }} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg"
                style={{ background: '#1f2937', border: '1px solid #374151' }}
              >
                <h3 className="font-semibold" style={{ color: '#f9fafb' }}>{item.title}</h3>
                {item.details && (
                  <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: '#9ca3af' }}>
                    {item.details}
                  </p>
                )}
                {(item.tarikh || item.masa) && (
                  <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                    {[item.tarikh, item.masa].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center" style={{ color: '#6b7280' }}>
            Tiada kandungan dalam {CATEGORIES.find((c) => c.id === activeTab)?.label}.
          </p>
        )}
      </div>
    </div>
  );
};

export default CampusLifeDisplay;
