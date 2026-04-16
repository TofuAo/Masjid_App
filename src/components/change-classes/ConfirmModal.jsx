import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { AlertCircle, Calendar } from 'lucide-react';

/**
 * ConfirmModal — confirmation dialog: summary, assignment type (Permanent / Exam), exam session, end date, Confirm / Cancel.
 */
export default function ConfirmModal({
  open,
  onClose,
  fromClass,
  toClass,
  selectedCount,
  assignmentType,
  onAssignmentTypeChange,
  examSessionId,
  onExamSessionChange,
  examSessions,
  examEndDate,
  onExamEndDateChange,
  onSubmit,
  submitting,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md shadow-xl">
        <Card.Header className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="w-5 h-5" />
          <Card.Title>Pratonton Perubahan</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <p>
            <strong>{selectedCount}</strong> pelajar dari <strong>{fromClass?.nama_kelas ?? '—'}</strong> akan ditugaskan ke{' '}
            <strong>{toClass?.nama_kelas ?? '—'}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modalAssignmentType"
                  checked={assignmentType === 'permanent'}
                  onChange={() => onAssignmentTypeChange('permanent')}
                  className="rounded border-gray-300 text-emerald-600"
                />
                <span>Permanent</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modalAssignmentType"
                  checked={assignmentType === 'exam'}
                  onChange={() => onAssignmentTypeChange('exam')}
                  className="rounded border-gray-300 text-emerald-600"
                />
                <span>Exam Only</span>
              </label>
            </div>
          </div>
          {assignmentType === 'exam' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Session</label>
                <select
                  value={examSessionId}
                  onChange={(e) => onExamSessionChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">— Pilih sesi —</option>
                  {examSessions.map((es) => (
                    <option key={es.id} value={es.id}>
                      {es.name} ({es.start_date} – {es.end_date})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Tarikh tamat
                </label>
                <input
                  type="date"
                  value={examEndDate}
                  onChange={(e) => onExamEndDateChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={submitting || (assignmentType === 'exam' && !examEndDate)}
            >
              {submitting ? 'Menyimpan...' : 'Confirm'}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
