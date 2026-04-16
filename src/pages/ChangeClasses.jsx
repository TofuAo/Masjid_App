import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BackButton from '../components/ui/BackButton';
import StudentList from '../components/change-classes/StudentList';
import ClassSelector from '../components/change-classes/ClassSelector';
import ConfirmModal from '../components/change-classes/ConfirmModal';
import { adminClassesAPI, classesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { BookOpen, Search, RotateCcw } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

const LEVEL_OPTIONS = ['Asas', 'Tahsin Asas', 'Pertengahan', 'Lanjutan', 'Tahsin Lanjutan', 'Talaqi'];

export default function ChangeClasses({ user }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedFromClassId, setSelectedFromClassId] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [selectedIcs, setSelectedIcs] = useState(new Set());
  const [toClassId, setToClassId] = useState('');
  const [assignmentType, setAssignmentType] = useState('permanent');
  const [examSessionId, setExamSessionId] = useState('');
  const [examEndDate, setExamEndDate] = useState('');
  const [examSessions, setExamSessions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rollbacking, setRollbacking] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
  }, [isAdmin, navigate]);

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      let res;
      try {
        res = await adminClassesAPI.getClasses({ limit: 500 });
      } catch {
        res = await classesAPI.getAll({ limit: 1000 });
      }
      const list = res?.data && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : res?.data || [];
      setClasses(list);
    } catch (err) {
      toast.error('Gagal memuatkan senarai kelas.');
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const fetchExamSessions = useCallback(async () => {
    try {
      const res = await adminClassesAPI.getExamSessions();
      setExamSessions(res?.data || []);
    } catch {
      setExamSessions([]);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchClasses();
      fetchExamSessions();
    }
  }, [isAdmin, fetchClasses, fetchExamSessions]);

  const fetchClassStudents = useCallback(async (classId) => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setLoadingDetails(true);
    try {
      let list = [];
      try {
        const res = await adminClassesAPI.getClassStudents(classId);
        list = res?.data || [];
      } catch {
        const res = await classesAPI.getById(classId);
        const data = res?.data || res;
        const raw = data?.students || [];
        list = raw.map((s) => ({ id: s.ic, name: s.nama, status: s.status, current_assignment_type: 'permanent' }));
      }
      setStudents(list);
      setSelectedIcs(new Set());
    } catch (err) {
      toast.error('Gagal memuatkan pelajar dalam kelas.');
      setStudents([]);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFromClassId) fetchClassStudents(selectedFromClassId);
    else setStudents([]);
  }, [selectedFromClassId, fetchClassStudents]);

  const fromClassOptions = filterLevel ? classes.filter((c) => (c.level || '') === filterLevel) : classes;
  const fromClass = classes.find((c) => c.id === selectedFromClassId);

  const toggleStudent = (id) => {
    if (!id) return;
    setSelectedIcs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const filtered = searchStudent.trim()
      ? students.filter(
          (s) =>
            (s.name || s.nama || '').toLowerCase().includes(searchStudent.trim().toLowerCase()) ||
            (s.id || s.ic || '').toLowerCase().includes(searchStudent.trim().toLowerCase())
        )
      : students;
    if (selectedIcs.size === filtered.length) {
      setSelectedIcs(new Set());
    } else {
      setSelectedIcs(new Set(filtered.map((s) => s.id || s.ic)));
    }
  };

  const handlePreview = () => {
    if (selectedIcs.size === 0) {
      toast.warning('Pilih sekurang-kurangnya seorang pelajar.');
      return;
    }
    const toId = parseInt(toClassId, 10);
    if (!toClassId || Number.isNaN(toId) || toId < 1) {
      toast.warning('Pilih kelas destinasi.');
      return;
    }
    if (assignmentType === 'exam' && !examEndDate) {
      toast.warning('Sila masukkan tarikh tamat untuk assignment peperiksaan.');
      return;
    }
    setShowPreview(true);
  };

  const submitChange = async () => {
    const toId = parseInt(toClassId, 10);
    if (Number.isNaN(toId) || toId < 1) {
      toast.error('Kelas destinasi tidak sah.');
      return;
    }
    setSubmitting(true);
    try {
      const fromId = Number(selectedFromClassId);
      if (Number.isNaN(fromId) || fromId < 1) {
        toast.error('Kelas sumber tidak sah.');
        return;
      }
      const payload = {
        student_ids: Array.from(selectedIcs),
        from_class_id: fromId,
        to_class_id: toId,
        assignment_type: assignmentType,
        end_date: assignmentType === 'exam' ? examEndDate : undefined,
        exam_session_id: assignmentType === 'exam' && examSessionId ? Number(examSessionId) : undefined,
      };
      try {
        await adminClassesAPI.change(payload);
      } catch (adminErr) {
        if (adminErr?.status === 403 || adminErr?.response?.status === 403) {
          await classesAPI.changeClass({
            student_ids: Array.from(selectedIcs),
            from_class_id: fromId,
            to_class_id: toId,
            assignment_type: assignmentType,
            end_date: assignmentType === 'exam' ? examEndDate : undefined,
          });
        } else {
          throw adminErr;
        }
      }
      toast.success(
        assignmentType === 'permanent' ? 'Kelas pelajar telah dikemas kini secara kekal.' : 'Assignment kelas peperiksaan telah disimpan.'
      );
      setShowPreview(false);
      setSelectedIcs(new Set());
      setToClassId('');
      fetchClassStudents(selectedFromClassId);
      fetchClasses();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal menukar kelas.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRollback = async () => {
    if (selectedIcs.size === 0) {
      toast.warning('Pilih pelajar untuk rollback.');
      return;
    }
    setRollbacking(true);
    try {
      await adminClassesAPI.rollback({ student_ids: Array.from(selectedIcs) });
      toast.success('Rollback selesai.');
      setSelectedIcs(new Set());
      fetchClassStudents(selectedFromClassId);
      fetchClasses();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal rollback.';
      toast.error(msg);
    } finally {
      setRollbacking(false);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || !active?.id) return;
    const overStr = String(over.id);
    if (overStr.startsWith('class-')) {
      const classId = overStr.replace('class-', '');
      setToClassId(classId);
      setSelectedIcs((prev) => new Set([...prev, active.id]));
      toast.info(`Pelajar dipilih. Pilih kelas destinasi atau seret ke kelas lain, kemudian klik Move Selected.`);
    }
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <BackButton to="/kelas" />
        <h1 className="text-2xl font-bold text-gray-900">Change Classes</h1>
      </div>

      {/* Top Filter Bar */}
      <Card>
        <Card.Content className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahap (Level)</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua tahap</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cari pelajar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nama atau IC..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                CURRENT CLASS: {fromClass?.nama_kelas || '—'}
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <StudentList
                fromClassOptions={fromClassOptions}
                selectedFromClassId={selectedFromClassId}
                onSelectSourceClass={setSelectedFromClassId}
                students={students}
                loadingDetails={loadingDetails}
                searchStudent={searchStudent}
                onSearchChange={setSearchStudent}
                selectedIcs={selectedIcs}
                onToggleStudent={toggleStudent}
                onToggleAll={toggleAll}
                loadingClasses={loadingClasses}
              />
              <div className="mt-3 flex gap-2">
                <Button onClick={handleRollback} variant="outline" disabled={selectedIcs.size === 0 || rollbacking}>
                  <RotateCcw className="w-4 h-4 mr-1 inline" />
                  {rollbacking ? 'Memproses...' : 'Rollback assignment'}
                </Button>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="space-y-4 pt-6">
              <ClassSelector
                fromClassOptions={fromClassOptions}
                selectedFromClassId={selectedFromClassId}
                toClassId={toClassId}
                onSelectTargetClass={setToClassId}
                classes={classes}
                loadingClasses={loadingClasses}
                selectedCount={selectedIcs.size}
                onConfirmMove={handlePreview}
              />
            </Card.Content>
          </Card>
        </div>
      </DndContext>

      <ConfirmModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        fromClass={fromClass}
        toClass={classes.find((c) => Number(c.id) === Number(toClassId))}
        selectedCount={selectedIcs.size}
        assignmentType={assignmentType}
        onAssignmentTypeChange={setAssignmentType}
        examSessionId={examSessionId}
        onExamSessionChange={setExamSessionId}
        examSessions={examSessions}
        examEndDate={examEndDate}
        onExamEndDateChange={setExamEndDate}
        onSubmit={submitChange}
        submitting={submitting}
      />
    </div>
  );
}
