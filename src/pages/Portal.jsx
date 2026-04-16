import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Megaphone, Inbox, MessageSquare } from 'lucide-react';
import { studentsAPI, classesAPI, announcementsAPI, notificationAPI, adminAPI } from '../services/api';
import { getEffectiveRole } from '../utils/userRoles';

/** FM26-style Portal: Tiles + Cards + Left Messages Panel */
const Portal = ({ user }) => {
  const effectiveRole = getEffectiveRole(user) || 'admin';
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'pic';

  const [stats, setStats] = useState({ students: 0, classes: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, c, ann, notif, pend] = await Promise.allSettled([
          studentsAPI.getStats(),
          classesAPI.getStats(),
          announcementsAPI.getAll().catch(() => []),
          notificationAPI.getNotifications({}).catch(() => ({ notifications: [] })),
          isAdmin ? adminAPI.getPendingApprovalsSummary().catch(() => ({ pendingApprovals: 0 })) : Promise.resolve({ pendingApprovals: 0 }),
        ]);

        const studentsData = s.status === 'fulfilled' ? s.value : {};
        const classesData = c.status === 'fulfilled' ? c.value : {};
        setStats({
          students: studentsData?.total ?? studentsData?.data?.total ?? 0,
          classes: classesData?.total ?? classesData?.data?.total ?? 0,
        });

        const annData = ann.status === 'fulfilled' ? ann.value : [];
        const annList = Array.isArray(annData) ? annData : (annData?.data ?? []);

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const hariKonvo = { id: 'hari-konvo', title: 'Hari konvo', content: 'Final rehearsals begin this Friday.' };
        const merged = [hariKonvo, ...annList.filter((a) => a.title?.toLowerCase() !== 'hari konvo').slice(0, 4)];
        setAnnouncements(merged);

        const notifData = notif.status === 'fulfilled' ? notif.value : {};
        const notifList = notifData?.notifications ?? notifData?.data ?? (Array.isArray(notifData) ? notifData : []);
        const unread = Array.isArray(notifList) ? notifList.filter((n) => !n.read).slice(0, 5) : [];
        setMessages(unread);

        const pendData = pend.status === 'fulfilled' ? pend.value : {};
        setPendingCount(pendData?.pendingApprovals ?? pendData?.data?.pendingApprovals ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="portal-container">
        <div className="tile animate-pulse h-24" />
        <div className="tile animate-pulse h-24" />
        <div className="portal-card animate-pulse h-48" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 md:p-6 min-h-0">
      {/* Left Panel: Messages (urgent notes, staff feedback, unread) */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="portal-card !grid-column-auto h-fit">
          <div className="portal-card-header">
            <h2 className="text-base font-semibold text-slate-800 m-0 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mesej
            </h2>
            {messages.length > 0 && (
              <span className="text-red-500 font-bold text-xs">{messages.length} Baru</span>
            )}
          </div>
          <ul className="list-none p-0 m-0 space-y-2">
            {messages.length > 0 ? (
              messages.map((m, i) => (
                <li key={m.id || i} className="py-2 border-b border-slate-100 last:border-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{m.title || m.message || 'Notifikasi'}</p>
                  <p className="text-xs text-slate-500 truncate">{m.body || m.content || ''}</p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500 py-4">Tiada mesej baru.</li>
            )}
          </ul>
          <Link
            to="/notifications"
            className="block mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Lihat semua →
          </Link>
        </div>
      </aside>

      {/* Main: Tiles + Announcements Card */}
      <div className="portal-container flex-1 min-w-0 !p-0">
        <Link to="/squad" className="tile">
          <div className="tile-title">Jumlah Pelajar</div>
          <div className="tile-value">{stats.students.toLocaleString()}</div>
        </Link>

        <Link to="/squad" className="tile">
          <div className="tile-title">Jumlah Kelas</div>
          <div className="tile-value">{stats.classes.toLocaleString()}</div>
        </Link>

        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="text-lg font-semibold text-slate-800 m-0 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              Pengumuman
            </h2>
            {announcements.length > 0 && (
              <span className="text-red-500 font-bold text-xs">{announcements.length} Item</span>
            )}
          </div>
          <ul className="list-none p-0 m-0 space-y-0">
            {announcements.map((item, i) => (
              <li
                key={item.id || i}
                className="py-3 border-b border-slate-100 last:border-0"
              >
                <strong className="text-slate-800">{i + 1}. {item.title}</strong>
                {item.content && (
                  <span className="text-slate-600 text-sm"> - {item.content}</span>
                )}
              </li>
            ))}
          </ul>
          {isAdmin && pendingCount > 0 && (
            <Link
              to="/portal/inbox"
              className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100"
            >
              <Inbox className="w-4 h-4" />
              {pendingCount} permintaan menunggu kelulusan
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portal;
