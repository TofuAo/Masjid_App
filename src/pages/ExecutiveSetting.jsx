import React from 'react';
import { Link, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  StickyNote,
  Archive,
  Shield,
  ChevronRight,
} from 'lucide-react';
import CampusLifeManager from './executive-setting/CampusLifeManager';
import PengurusanKelas from './executive-setting/PengurusanKelas';
import PengurusanGuru from './executive-setting/PengurusanGuru';
import MemoEditor from './executive-setting/MemoEditor';
import NewSeason from './executive-setting/NewSeason';
import RolesSetting from './executive-setting/RolesSetting';

const SUB_MENU = [
  { to: '/executive-setting/campus-life', label: 'Campus Life Manager', icon: Building2 },
  { to: '/executive-setting/kelas', label: 'Pengurusan Kelas', icon: GraduationCap },
  { to: '/executive-setting/guru', label: 'Pengurusan Guru', icon: Users },
  { to: '/executive-setting/memo', label: 'Memo/Nota Editor', icon: StickyNote },
  { to: '/executive-setting/season', label: 'New Season (Archive)', icon: Archive },
  { to: '/executive-setting/roles', label: 'Roles Setting', icon: Shield },
];

const ExecutiveSetting = () => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f9fafb' }}>
          Executive Setting
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
          Pentadbiran sistem - Campus Life, Kelas, Guru, Memo, Season, Roles
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 flex-shrink-0">
          <div className="fm-card p-2">
            {SUB_MENU.map((item) => {
              const isActive = pathname === item.to || pathname.startsWith(item.to + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#16a34a]/20 text-[#16a34a]'
                      : 'text-[#9ca3af] hover:bg-[#1f2937] hover:text-[#f9fafb]'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<NavigateToFirst />} />
            <Route path="campus-life" element={<CampusLifeManager />} />
            <Route path="kelas" element={<PengurusanKelas />} />
            <Route path="guru" element={<PengurusanGuru />} />
            <Route path="memo" element={<MemoEditor />} />
            <Route path="season" element={<NewSeason />} />
            <Route path="roles" element={<RolesSetting />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const NavigateToFirst = () => <Navigate to="/executive-setting/campus-life" replace />;

export default ExecutiveSetting;
