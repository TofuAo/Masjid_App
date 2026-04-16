import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Users, Leaf } from 'lucide-react';

/** Club/Institution: Finances, Staff, Facilities */
const Club = () => (
  <div className="p-4 md:p-6 max-w-5xl mx-auto">
    <h1 className="text-xl font-bold text-slate-800 mb-6">Club / Institution</h1>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Link
        to="/campus-life"
        className="portal-card !grid-column-auto p-6 hover:shadow-lg transition-shadow"
      >
        <DollarSign className="w-10 h-10 text-emerald-600 mb-3" />
        <h3 className="font-semibold text-slate-800 mb-1">Finances</h3>
        <p className="text-sm text-slate-600">Bajet sekolah, yuran.</p>
      </Link>
      <Link
        to="/carian"
        className="portal-card !grid-column-auto p-6 hover:shadow-lg transition-shadow"
      >
        <Users className="w-10 h-10 text-emerald-600 mb-3" />
        <h3 className="font-semibold text-slate-800 mb-1">Staff</h3>
        <p className="text-sm text-slate-600">Tanggungjawab guru dan pentadbir.</p>
      </Link>
      <Link
        to="/campus-life"
        className="portal-card !grid-column-auto p-6 hover:shadow-lg transition-shadow"
      >
        <Leaf className="w-10 h-10 text-emerald-600 mb-3" />
        <h3 className="font-semibold text-slate-800 mb-1">Kehidupan Kampus</h3>
        <p className="text-sm text-slate-600">Fasiliti, aktiviti, visi sekolah.</p>
      </Link>
    </div>
  </div>
);

export default Club;
