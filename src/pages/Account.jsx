import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import {
  User,
  Pencil,
  GraduationCap,
  BookOpen,
  X,
  Mail,
  Phone,
  MapPin,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';
import { formatPhone, isValidPhone } from '../utils/phoneUtils';

const CLASS_TRACK_OPTIONS = [
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Part-Time', label: 'Part-Time' },
  { value: 'Online', label: 'Online' },
];

const Account = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    telefon: '',
    alamat: '',
    umur: '',
    academic_bio: '',
    class_track: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const effectiveRole = user ? getEffectiveRole(user) : null;
  const isStudent = effectiveRole === 'student';

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authAPI.getProfile();
      if (res?.success && res?.data) {
        setProfile(res.data);
        setEditForm({
          email: res.data.email || '',
          telefon: res.data.telefon || '',
          alamat: res.data.alamat || '',
          umur: res.data.umur != null ? String(res.data.umur) : '',
          academic_bio: res.data.academic_bio || '',
          class_track: res.data.class_track || '',
        });
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      setLoading(false);
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    try {
      if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
        toast.error('Sila masukkan emel yang sah.');
        return;
      }
      if (editForm.telefon && !isValidPhone(editForm.telefon)) {
        toast.error('Sila masukkan nombor telefon yang sah (contoh: 012-3456789).');
        return;
      }
      setSavingProfile(true);
      const res = await authAPI.updateProfile({
        email: editForm.email.trim() || null,
        telefon: editForm.telefon.trim() || null,
        alamat: editForm.alamat.trim() || null,
        umur: editForm.umur ? parseInt(editForm.umur, 10) : undefined,
        academic_bio: editForm.academic_bio.trim() || null,
        class_track: editForm.class_track || null,
      });
      if (res?.success) {
        toast.success('Profil berjaya dikemaskini.');
        setEditModalOpen(false);
        await fetchProfile();
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          u.email = res.data?.email ?? editForm.email;
          u.telefon = res.data?.telefon ?? editForm.telefon;
          localStorage.setItem('user', JSON.stringify(u));
          setUser(u);
        }
      } else {
        toast.error(res?.message || 'Gagal mengemaskini profil.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error?.response?.data?.message || 'Gagal mengemaskini profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiada Data Pengguna</h3>
        <p className="text-gray-600">Sila log masuk untuk melihat maklumat akaun anda.</p>
      </div>
    );
  }

  const displayName = profile?.nama || user.nama || 'Pengguna';
  const academicBio = profile?.academic_bio || '';
  const email = profile?.email || user.email || '';
  const telefon = profile?.telefon || user.telefon || '';
  const alamat = profile?.alamat || '';
  const umur = profile?.umur != null ? String(profile.umur) : '';
  const classTrack = profile?.class_track || '';

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Card.Title className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-black">{displayName}</h1>
                <p className="text-sm text-gray-500 mt-0.5">No. Telefon {user.ic_formatted || user.telefon || '—'}</p>
                {academicBio && (
                  <p className="text-sm text-gray-600 mt-1">{academicBio}</p>
                )}
              </div>
            </Card.Title>
            <Button variant="primary" onClick={() => setEditModalOpen(true)} className="inline-flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </Card.Header>
      </Card>

      {/* Space below: Contact info + Personal details in two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <span>Contact info</span>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium inline-flex items-center gap-1"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </Card.Title>
          </Card.Header>
          <Card.Content className="pt-0">
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <dt className="text-gray-500 font-medium">Emel</dt>
                  <dd className="text-black mt-0.5">{email || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <dt className="text-gray-500 font-medium">Telefon</dt>
                  <dd className="text-black mt-0.5">{telefon || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <dt className="text-gray-500 font-medium">Alamat</dt>
                  <dd className="text-black mt-0.5">{alamat || '—'}</dd>
                </div>
              </div>
            </dl>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center justify-between">
              <span>Personal details</span>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium inline-flex items-center gap-1"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </Card.Title>
          </Card.Header>
          <Card.Content className="pt-0">
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <dt className="text-gray-500 font-medium">Umur</dt>
                  <dd className="text-black mt-0.5">{umur || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                
              </div>
              {isStudent && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-gray-500 font-medium">Class Type</dt>
                    <dd className="text-black mt-0.5">{classTrack || '—'}</dd>
                  </div>
                </div>
              )}
            </dl>
          </Card.Content>
        </Card>
      </div>

      {/* Quick links for students – use space below */}
      {isStudent && (
        <Card>
          <Card.Header>
            <Card.Title>Quick links</Card.Title>
          </Card.Header>
          <Card.Content className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/keputusan"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-black">Keputusan / Transcript</span>
              </Link>
              <Link
                to="/resit"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
              >
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-black">Resit / Ulangan</span>
              </Link>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Edit Profile Modal – sectioned like reference (Contact info, Personal details) */}
      {editModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="mosque-card w-full max-w-md max-h-[90vh] flex flex-col overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <Card.Title>Edit profile</Card.Title>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-500 hover:text-gray-700 p-1" aria-label="Tutup">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contact info */}
            <div className="mb-6">
              <button type="button" className="flex w-full items-center justify-between py-2 text-left">
                <span className="text-base font-semibold text-black">Contact info</span>
                <ChevronUp className="w-5 h-5 text-gray-500" />
              </button>
              <div className="divide-y divide-gray-200">
                <div className="flex items-center gap-3 py-3">
                  <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-500 block">Phone Number</span>
                    <input
                      type="tel"
                      value={editForm.telefon}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, telefon: formatPhone(e.target.value, true) }))
                      }
                      className="w-full mt-0.5 px-0 py-1 border-0 border-b border-gray-300 rounded-none text-black bg-transparent focus:ring-0 focus:border-emerald-500"
                      placeholder="Add phone"
                    />
                  </div>
                  <Pencil className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-3 py-3">
                  <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-500 block">Email</span>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full mt-0.5 px-0 py-1 border-0 border-b border-gray-300 rounded-none text-black bg-transparent focus:ring-0 focus:border-emerald-500"
                      placeholder="Add email"
                    />
                  </div>
                  <Pencil className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-3 py-3">
                  <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-500 block">Alamat</span>
                    <input
                      type="text"
                      value={editForm.alamat}
                      onChange={(e) => setEditForm((f) => ({ ...f, alamat: e.target.value }))}
                      className="w-full mt-0.5 px-0 py-1 border-0 border-b border-gray-300 rounded-none text-black bg-transparent focus:ring-0 focus:border-emerald-500"
                      placeholder="Add address"
                    />
                  </div>
                  <Pencil className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Personal details */}
            <div className="mb-6">
              <button type="button" className="flex w-full items-center justify-between py-2 text-left">
                <span className="text-base font-semibold text-black">Personal details</span>
                <ChevronUp className="w-5 h-5 text-gray-500" />
              </button>
              <div className="divide-y divide-gray-200">
                <div className="flex items-center gap-3 py-3">
                  <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-500 block">Umur</span>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={editForm.umur}
                      onChange={(e) => setEditForm((f) => ({ ...f, umur: e.target.value }))}
                      className="w-full mt-0.5 px-0 py-1 border-0 border-b border-gray-300 rounded-none text-black bg-transparent focus:ring-0 focus:border-emerald-500"
                      placeholder="Add age"
                    />
                  </div>
                  <Pencil className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
                {isStudent && (
                  <>
                    
                    <div className="flex items-center gap-3 py-3">
                      <GraduationCap className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-500 block">Class Type</span>
                        <select
                          value={editForm.class_track}
                          onChange={(e) => setEditForm((f) => ({ ...f, class_track: e.target.value }))}
                          className="w-full mt-0.5 px-0 py-1 border-0 border-b border-gray-300 rounded-none text-black bg-transparent focus:ring-0 focus:border-emerald-500 appearance-none bg-none"
                        >
                          <option value="">— Pilih —</option>
                          {CLASS_TRACK_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Pencil className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="primary" onClick={handleSaveProfile} disabled={savingProfile} className="flex-1">
                {savingProfile ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
