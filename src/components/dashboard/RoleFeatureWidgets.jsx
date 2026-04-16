import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import {
  FileCheck,
  UserCheck,
  Calendar,
  Clock,
  BookOpen,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ibAPI, adminAPI, attendanceAPI, staffCheckInAPI, feesAPI } from '../../services/api';
import { getEffectiveRole } from '../../utils/userRoles';

/**
 * Role-based feature widgets: one new feature per role, shown on Dashboard.
 * - IB: Pending payment confirmations count
 * - Admin: Pending approvals summary (registrations, PIC, contact)
 * - PIC: Today's attendance overview (classes with session today)
 * - Staff: My check-in status today
 * - Teacher: My classes today (attendance due)
 * - Student: Next fee due
 */
const RoleFeatureWidgets = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const role = user ? getEffectiveRole(user) : null;

  useEffect(() => {
    if (!role) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const fetchByRole = async () => {
      try {
        if (role === 'ib') {
          const res = await ibAPI.getPendingConfirmationsCount();
          if (!cancelled && res?.data?.data) setData({ type: 'ib', ...res.data.data });
        } else if (role === 'admin') {
          const res = await adminAPI.getPendingApprovalsSummary();
          if (!cancelled && res?.data?.data) setData({ type: 'admin', ...res.data.data });
        } else if (role === 'pic') {
          const res = await attendanceAPI.getTodayOverview();
          if (!cancelled && res?.data?.data) setData({ type: 'pic', ...res.data.data });
        } else if (role === 'staff' || role === 'teacher') {
          if (role === 'staff') {
            const res = await staffCheckInAPI.getTodayStatus();
            if (!cancelled) setData({ type: 'staff', ...(res?.data || {}) });
          } else {
            const res = await attendanceAPI.getMyClassesToday();
            if (!cancelled && res?.data?.data) setData({ type: 'teacher', ...res.data.data });
          }
        } else if (role === 'student') {
          const res = await feesAPI.getNextDue();
          if (!cancelled && res?.data?.data !== undefined) setData({ type: 'student', nextDue: res.data.data });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Gagal memuatkan data');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchByRole();
    return () => { cancelled = true; };
  }, [role]);

  if (!role || !['ib', 'admin', 'pic', 'staff', 'teacher', 'student'].includes(role)) {
    return null;
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <Card.Content className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50/50">
        <Card.Content className="p-4 flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </Card.Content>
      </Card>
    );
  }

  // IB: Pending confirmations count
  if (data?.type === 'ib') {
    const count = data.count ?? 0;
    return (
      <Card className="mb-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Pengesahan Pembayaran</p>
              <h3 className="text-2xl font-bold mt-1">{count} laporan menunggu pengesahan</h3>
              <p className="text-purple-100 text-xs mt-1">Sila sahkan di IB Dashboard</p>
            </div>
            <FileCheck className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
          <Link
            to="/ib-dashboard"
            className="mt-4 inline-flex items-center text-sm font-medium text-purple-100 hover:text-white"
          >
            Pergi ke IB Dashboard →
          </Link>
        </Card.Content>
      </Card>
    );
  }

  // Admin: Pending approvals summary
  if (data?.type === 'admin') {
    const reg = data.pendingRegistrationsCount ?? 0;
    const pic = data.pendingPicApprovalsCount ?? 0;
    const contact = data.unreadContactCount ?? 0;
    const total = reg + pic + contact;
    if (total === 0) return null;
    return (
      <Card className="mb-6 bg-gradient-to-br from-blue-500 to-blue-700 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Tindakan Tertunggak</p>
              <h3 className="text-2xl font-bold mt-1">{total} item memerlukan perhatian</h3>
              <ul className="text-blue-100 text-sm mt-2 space-y-0.5">
                {reg > 0 && <li>{reg} pendaftaran menunggu kelulusan</li>}
                {pic > 0 && <li>{pic} permohonan PIC menunggu kelulusan</li>}
                {contact > 0 && <li>{contact} mesej hubungi kami</li>}
              </ul>
            </div>
            <UserCheck className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {reg > 0 && (
              <Link to="/pending-registrations" className="text-sm font-medium text-blue-100 hover:text-white underline">
                Kelulusan Pendaftaran
              </Link>
            )}
            {pic > 0 && (
              <Link to="/pic-approvals" className="text-sm font-medium text-blue-100 hover:text-white underline">
                Kelulusan PIC
              </Link>
            )}
            {contact > 0 && (
              <Link to="/contact" className="text-sm font-medium text-blue-100 hover:text-white underline">
                Mesej Hubungi
              </Link>
            )}
          </div>
        </Card.Content>
      </Card>
    );
  }

  // PIC: Today's attendance overview
  if (data?.type === 'pic' && data.classes) {
    const classes = data.classes || [];
    const recorded = classes.filter((c) => c.hasAttendanceRecordedToday).length;
    const pending = classes.length - recorded;
    return (
      <Card className="mb-6 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Kehadiran Hari Ini ({data.dayName || 'Hari ini'})</p>
              <h3 className="text-2xl font-bold mt-1">{recorded}/{classes.length} kelas telah direkod</h3>
              {pending > 0 && (
                <p className="text-emerald-100 text-xs mt-1">{pending} kelas belum rekod kehadiran</p>
              )}
            </div>
            <Calendar className="w-12 h-12 text-emerald-200 opacity-80" />
          </div>
          {classes.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {classes.slice(0, 5).map((c) => (
                <li key={c.classId} className="flex items-center gap-2">
                  {c.hasAttendanceRecordedToday ? (
                    <CheckCircle className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-200 flex-shrink-0" />
                  )}
                  <span>{c.className}</span>
                </li>
              ))}
              {classes.length > 5 && <li className="text-emerald-100">+{classes.length - 5} lagi</li>}
            </ul>
          )}
          <Link to="/attendance" className="mt-4 inline-flex items-center text-sm font-medium text-emerald-100 hover:text-white">
            Rekod Kehadiran →
          </Link>
        </Card.Content>
      </Card>
    );
  }

  // Staff: My check-in status today
  if (data?.type === 'staff') {
    const status = data.status || data.data?.status;
    const record = data.data;
    const checkedIn = status === 'checked_in' || (record && record.status === 'checked_in');
    const checkInTime = record?.check_in_time;
    const timeStr = checkInTime
      ? new Date(checkInTime).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
      : null;
    return (
      <Card className="mb-6 bg-gradient-to-br from-orange-500 to-orange-700 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Check-in Hari Ini</p>
              {checkedIn ? (
                <>
                  <h3 className="text-2xl font-bold mt-1">Anda telah check-in</h3>
                  {timeStr && <p className="text-orange-100 text-xs mt-1">Sejak {timeStr}</p>}
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mt-1">Belum check-in</h3>
                  <p className="text-orange-100 text-xs mt-1">Check-in apabila tiba di masjid</p>
                </>
              )}
            </div>
            <Clock className="w-12 h-12 text-orange-200 opacity-80" />
          </div>
          <Link to="/staff-checkin" className="mt-4 inline-flex items-center text-sm font-medium text-orange-100 hover:text-white">
            {checkedIn ? 'Lihat Check-in / Check-out' : 'Check-in Sekarang'} →
          </Link>
        </Card.Content>
      </Card>
    );
  }

  // Teacher: My classes today
  if (data?.type === 'teacher' && data.classes) {
    const classes = data.classes || [];
    const recorded = classes.filter((c) => c.hasAttendanceRecordedToday).length;
    const pending = classes.length - recorded;
    return (
      <Card className="mb-6 bg-gradient-to-br from-teal-500 to-teal-700 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Kelas Anda Hari Ini ({data.dayName || 'Hari ini'})</p>
              <h3 className="text-2xl font-bold mt-1">{classes.length} kelas</h3>
              <p className="text-teal-100 text-xs mt-1">
                {recorded} telah rekod kehadiran{pending > 0 ? `, ${pending} belum` : ''}
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-teal-200 opacity-80" />
          </div>
          {classes.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {classes.slice(0, 5).map((c) => (
                <li key={c.classId} className="flex items-center gap-2">
                  {c.hasAttendanceRecordedToday ? (
                    <CheckCircle className="w-4 h-4 text-teal-200 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-200 flex-shrink-0" />
                  )}
                  <span>{c.className}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/attendance" className="mt-4 inline-flex items-center text-sm font-medium text-teal-100 hover:text-white">
            Rekod Kehadiran →
          </Link>
        </Card.Content>
      </Card>
    );
  }

  // Student: Next fee due — link directly to pay page when feeId exists (≤2 clicks)
  if (data?.type === 'student') {
    const next = data.nextDue;
    if (!next) return null;
    const payUrl = next.feeId ? `/pay-yuran/${next.feeId}` : '/yuran';
    return (
      <Card className="mb-6 bg-gradient-to-br from-rose-500 to-rose-700 text-white">
        <Card.Content className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Yuran Seterusnya</p>
              <h3 className="text-2xl font-bold mt-1">RM {Number(next.amount || 0).toFixed(2)}</h3>
              <p className="text-rose-100 text-xs mt-1">
                {next.bulan} {next.tahun}
              </p>
            </div>
            <CreditCard className="w-12 h-12 text-rose-200 opacity-80" />
          </div>
          <Link to={payUrl} className="mt-4 inline-flex items-center text-sm font-medium text-rose-100 hover:text-white">
            {next.feeId ? 'Bayar Sekarang →' : 'Bayar Yuran →'}
          </Link>
        </Card.Content>
      </Card>
    );
  }

  return null;
};

export default RoleFeatureWidgets;
