import React from 'react';
import { Search, CheckSquare, Square, GripVertical } from 'lucide-react';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function DraggableStudentRow({ id, children, isSelected, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({ id });
  const style = { transform: CSS.Translate.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-50 ${isDragging ? 'opacity-70 bg-emerald-50' : ''}`}>
      <button type="button" className="text-gray-400 hover:text-emerald-600 cursor-grab active:cursor-grabbing touch-none p-0.5" aria-label="Seret ke kelas" {...listeners} {...attributes}>
        <GripVertical className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => onToggle(id)} className="text-gray-600 hover:text-emerald-600">
        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
      </button>
      {children}
    </li>
  );
}

/**
 * StudentList — left panel: source class dropdown + student list with checkboxes and search.
 */
export default function StudentList({
  fromClassOptions,
  selectedFromClassId,
  onSelectSourceClass,
  students,
  loadingDetails,
  searchStudent,
  onSearchChange,
  selectedIcs,
  onToggleStudent,
  onToggleAll,
  loadingClasses,
}) {
  const filteredStudents = searchStudent.trim()
    ? students.filter(
        (s) =>
          (s.name || s.nama || '').toLowerCase().includes(searchStudent.trim().toLowerCase()) ||
          (s.id || s.telefon || '').toLowerCase().includes(searchStudent.trim().toLowerCase())
      )
    : students;

  return (
    <>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Sumber (Current Class)</label>
        <select
          value={selectedFromClassId ?? ''}
          onChange={(e) => onSelectSourceClass(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          disabled={loadingClasses}
        >
          <option value="">-- Pilih kelas --</option>
          {fromClassOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama_kelas} ({c.level}) — {c.student_count ?? 0} pelajar
            </option>
          ))}
        </select>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama atau IC..."
          value={searchStudent}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="min-h-[240px]">
        {loadingDetails && <LoadingSkeleton type="lines" lines={4} />}
        {!loadingDetails && (
        <>
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={onToggleAll} className="text-sm text-emerald-600 hover:underline">
              {selectedIcs.size === filteredStudents.length ? 'Nyahpilih semua' : 'Pilih semua'}
            </button>
            <span className="text-sm text-gray-500">Dipilih: {selectedIcs.size}</span>
          </div>
          <ul className="border rounded-lg divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <li className="px-4 py-6 text-center text-gray-500">Tiada pelajar atau tiada padanan carian.</li>
            ) : (
              filteredStudents.map((s) => {
                const id = s.id || s.telefon;
                return (
                  <DraggableStudentRow
                    key={id}
                    id={id}
                    isSelected={selectedIcs.has(id)}
                    onToggle={onToggleStudent}
                  >
                    <span className="text-sm font-medium text-gray-900 flex-1">{s.name || s.nama || '-'}</span>
                    <span className="text-xs text-gray-500">{id}</span>
                    {s.current_assignment_type === 'exam' && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Exam</span>
                    )}
                  </DraggableStudentRow>
                );
              })
            )}
          </ul>
        </>
        )}
      </div>
    </>
  );
}
