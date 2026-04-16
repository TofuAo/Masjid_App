import React, { useState, useEffect } from 'react';
import { campusLifeAPI } from '../services/api';
import { BookOpen } from 'lucide-react';

/** Panduan - Direct view of Garis Panduan from Executive Setting */
const Panduan = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    campusLifeAPI
      .list({ status: 'approved', category: 'garis_panduan' })
      .then((res) => {
        const list = res?.data?.data ?? res?.data ?? [];
        setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f9fafb' }}>
          <BookOpen className="w-7 h-7" style={{ color: '#16a34a' }} />
          Panduan
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
          Garis panduan dan arahan
        </p>
      </div>

      <div className="fm-card">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: '#1f2937' }} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="pb-6 border-b last:border-0"
                style={{ borderColor: '#1f2937' }}
              >
                <h2 className="text-lg font-semibold mb-2" style={{ color: '#f9fafb' }}>
                  {item.title}
                </h2>
                {item.details && (
                  <div className="text-sm whitespace-pre-wrap" style={{ color: '#9ca3af' }}>
                    {item.details}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center" style={{ color: '#6b7280' }}>
            Tiada garis panduan buat masa ini.
          </p>
        )}
      </div>
    </div>
  );
};

export default Panduan;
