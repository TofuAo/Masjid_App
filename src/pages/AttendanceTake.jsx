/**
 * AttendanceTake - Standalone page for /attendance/take
 * Reads class_id and date from URL query params (?class=6&date=2026-02-13)
 * Shareable/refreshable URLs for "Ambil Kehadiran"
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import AttendanceFormModal from '../components/kehadiran/AttendanceFormModal';
import Card from '../components/ui/Card';
import { classesAPI } from '../services/api';
import { toast } from 'react-toastify';

const AttendanceTake = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classIdFromUrl = searchParams.get('class') || searchParams.get('class_id');
  const dateFromUrl = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [kelass, setKelass] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(classIdFromUrl || 'semua');
  const [selectedDate, setSelectedDate] = useState(dateFromUrl);
  const [showForm, setShowForm] = useState(!!classIdFromUrl);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classesAPI.getAll({ limit: 9999 });
        const list = Array.isArray(res) ? res : (res?.data || []);
        setKelass(list);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
        toast.error('Gagal memuatkan data kelas.');
      }
    };
    fetchClasses();
  }, []);

  // Sync from URL on mount
  useEffect(() => {
    if (classIdFromUrl) setSelectedClassId(classIdFromUrl);
    if (dateFromUrl) setSelectedDate(dateFromUrl);
  }, [classIdFromUrl, dateFromUrl]);

  useEffect(() => {
    if (selectedClassId !== 'semua') {
      setShowForm(true);
    }
  }, [selectedClassId]);

  const selectedClassName = kelass.find(k => String(k.id) === String(selectedClassId))?.nama_kelas ||
    kelass.find(k => String(k.id) === String(selectedClassId))?.class_name || 'Kelas';

  const handleFormSubmit = () => {
    navigate('/attendance', {
      search: `?class=${selectedClassId}&start_date=${selectedDate}&end_date=${selectedDate}`,
    });
  };

  const handleClose = () => {
    setShowForm(false);
    navigate('/attendance');
  };

  if (selectedClassId === 'semua' && !classIdFromUrl) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/attendance')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
              <Card.Title>Ambil Kehadiran</Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-600 mb-4">
              Sila pilih kelas dari halaman utama Kehadiran terlebih dahulu, atau gunakan pautan dengan parameter:
            </p>
            <code className="block p-4 bg-gray-100 rounded-lg text-sm">
              /attendance/take?class=6&date=2026-02-13
            </code>
            <Button onClick={() => navigate('/attendance')} className="mt-4">
              Ke Halaman Kehadiran
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleClose} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
            <Card.Title>Ambil Kehadiran - {selectedClassName}</Card.Title>
          </div>
        </Card.Header>
      </Card>

      <AttendanceFormModal
        isOpen={showForm}
        onClose={handleClose}
        classId={selectedClassId}
        className={selectedClassName}
        selectedDate={selectedDate}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default AttendanceTake;
