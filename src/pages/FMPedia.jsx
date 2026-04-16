import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookOpen } from 'lucide-react';
import Carian from './Carian';
import HelpCenter from './HelpCenter';

/** FMPedia: Bookmarks & Search - integrated glossary and search */
const FMPedia = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState(q ? 'carian' : 'help');

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Carian & Panduan
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('carian')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeTab === 'carian' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Carian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeTab === 'help' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Panduan
          </button>
        </div>
      </div>
      {activeTab === 'carian' ? <Carian /> : <HelpCenter />}
    </div>
  );
};

export default FMPedia;
