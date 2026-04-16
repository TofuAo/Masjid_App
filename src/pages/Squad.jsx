import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Stethoscope } from 'lucide-react';

/** Squad/Academic: Overview, Medical, Student profiles */
const Squad = () => (
  <div className="p-4 md:p-6 max-w-5xl mx-auto">
    <h1 className="text-xl font-bold text-slate-800 mb-6">Squad / Academic</h1>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Link
        to="/carian"
        className="portal-card !grid-column-auto p-6 hover:shadow-lg transition-shadow"
      >
        <Users className="w-10 h-10 text-emerald-600 mb-3" />
        <h3 className="font-semibold text-slate-800 mb-1">Overview</h3>
        <p className="text-sm text-slate-600">Senarai pelajar dan guru, hierarki kelas.</p>
      </Link>
      <Link
        to="/carian"
        className="portal-card !grid-column-auto p-6 hover:shadow-lg transition-shadow"
      >
        <Stethoscope className="w-10 h-10 text-emerald-600 mb-3" />
        <h3 className="font-semibold text-slate-800 mb-1">Medical</h3>
        <p className="text-sm text-slate-600">Kesihatan pelajar, kehadiran.</p>
      </Link>
      <Link
        to="/carian"
        className="portal-card !grid-column-auto p-6 hover:shadow-lg transition-shadow"
      >
        <BookOpen className="w-10 h-10 text-emerald-600 mb-3" />
        <h3 className="font-semibold text-slate-800 mb-1">Pelajar / Profil</h3>
        <p className="text-sm text-slate-600">Profil individu pelajar.</p>
      </Link>
    </div>
  </div>
);

export default Squad;
