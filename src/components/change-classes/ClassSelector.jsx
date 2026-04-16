import React from 'react';
import { ArrowRightCircle } from 'lucide-react';
import Button from '../ui/Button';
import { useDroppable } from '@dnd-kit/core';

function DroppableClassCard({ id, className, children, isSelected }) {
  const { setNodeRef, isOver } = useDroppable({ id: `class-${id}` });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 p-3 text-left transition-colors ${
        isOver ? 'border-emerald-500 bg-emerald-50' : isSelected ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-300'
      }`}
    >
      {children}
    </div>
  );
}

/**
 * ClassSelector — right panel: target class dropdown, droppable class cards, Confirm Move button.
 */
export default function ClassSelector({
  fromClassOptions,
  selectedFromClassId,
  toClassId,
  onSelectTargetClass,
  classes,
  loadingClasses,
  selectedCount,
  onConfirmMove,
}) {
  const toClass = classes.find((c) => c.id === Number(toClassId));
  const options = fromClassOptions.filter((c) => c.id !== selectedFromClassId);

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <ArrowRightCircle className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-900">TARGET CLASS</h3>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Destinasi</label>
        <select
          value={toClassId}
          onChange={(e) => onSelectTargetClass(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500"
          disabled={loadingClasses}
        >
          <option value="">-- Pilih kelas --</option>
          {options.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nama_kelas} ({c.level})
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-500 mt-2 mb-2">atau seret pelajar ke kelas di bawah:</p>
      <div className="flex flex-wrap gap-2">
        {options.map((c) => (
          <DroppableClassCard
            key={c.id}
            id={c.id}
            isSelected={String(toClassId) === String(c.id)}
          >
            <div className="text-sm font-medium text-gray-900">{c.nama_kelas}</div>
            <div className="text-xs text-gray-500">{c.level}</div>
          </DroppableClassCard>
        ))}
      </div>
      {toClass && (
        <p className="text-sm text-gray-600 mt-2">
          Kapasiti: <strong>{toClass.kapasiti ?? '—'}</strong>
          {toClass.student_count != null && (
            <> · Pelajar semasa: <strong>{toClass.student_count}</strong></>
          )}
        </p>
      )}
      <Button
        onClick={onConfirmMove}
        disabled={selectedCount === 0 || !toClassId}
        className="w-full mt-4"
      >
        Move Selected →
      </Button>
    </>
  );
}
