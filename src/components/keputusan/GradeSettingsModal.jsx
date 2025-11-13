import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

const DEFAULT_LOCAL_RANGES = [
  { grade: 'A+', min: '95', max: '100' },
  { grade: 'A', min: '90', max: '94' },
  { grade: 'A-', min: '85', max: '89' },
  { grade: 'B+', min: '80', max: '84' },
  { grade: 'B', min: '75', max: '79' },
  { grade: 'B-', min: '70', max: '74' },
  { grade: 'C+', min: '65', max: '69' },
  { grade: 'C', min: '60', max: '64' },
  { grade: 'C-', min: '55', max: '59' },
  { grade: 'D', min: '50', max: '54' },
  { grade: 'F', min: '0', max: '49' }
];

const mapInitialRanges = (ranges) => {
  if (!Array.isArray(ranges) || !ranges.length) {
    return DEFAULT_LOCAL_RANGES;
  }

  return ranges.map((range) => ({
    grade: (range?.grade || '').toString(),
    min:
      range?.min === undefined || range?.min === null
        ? ''
        : range.min.toString(),
    max:
      range?.max === undefined || range?.max === null
        ? ''
        : range.max.toString()
  }));
};

const GradeSettingsModal = ({
  isOpen,
  onClose,
  initialRanges,
  onSave,
  isSaving = false
}) => {
  const [localRanges, setLocalRanges] = useState(DEFAULT_LOCAL_RANGES);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors([]);
      setSubmitting(false);
      setLocalRanges(mapInitialRanges(initialRanges));
    }
  }, [isOpen, initialRanges]);

  const sanitizedPreview = useMemo(() => {
    return localRanges
      .map((range) => {
        const grade = (range.grade || '').trim();
        const min =
          range.min === '' || range.min === null || range.min === undefined
            ? NaN
            : Number(range.min);
        const max =
          range.max === '' || range.max === null || range.max === undefined
            ? null
            : Number(range.max);

        return {
          grade,
          min,
          max
        };
      })
      .filter((range) => range.grade && !Number.isNaN(range.min));
  }, [localRanges]);

  if (!isOpen) {
    return null;
  }

  const handleRangeChange = (index, field, value) => {
    setLocalRanges((prev) =>
      prev.map((range, idx) =>
        idx === index
          ? {
              ...range,
              [field]: value
            }
          : range
      )
    );
  };

  const handleAddRange = () => {
    setLocalRanges((prev) => [
      ...prev,
      { grade: '', min: '', max: '' }
    ]);
  };

  const handleRemoveRange = (index) => {
    setLocalRanges((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validateRanges = () => {
    const validationErrors = [];

    const sanitized = localRanges
      .map((range, index) => {
        const grade = (range.grade || '').trim();
        const min = Number(range.min);
        const hasMax =
          range.max !== '' && range.max !== null && range.max !== undefined;
        const max = hasMax ? Number(range.max) : null;

        if (!grade) {
          validationErrors.push(`Gred pada baris ${index + 1} diperlukan.`);
          return null;
        }

        if (Number.isNaN(min)) {
          validationErrors.push(`Min markah bagi gred ${grade} tidak sah.`);
          return null;
        }

        if (min < 0 || min > 100) {
          validationErrors.push(`Min markah bagi gred ${grade} mesti antara 0 hingga 100.`);
        }

        if (hasMax && Number.isNaN(max)) {
          validationErrors.push(`Max markah bagi gred ${grade} tidak sah.`);
          return null;
        }

        if (hasMax && (max < 0 || max > 100)) {
          validationErrors.push(`Max markah bagi gred ${grade} mesti antara 0 hingga 100.`);
        }

        if (hasMax && max < min) {
          validationErrors.push(`Max markah bagi gred ${grade} tidak boleh lebih rendah daripada min.`);
        }

        return {
          grade,
          min: Math.max(0, Math.min(100, min)),
          max: hasMax ? Math.max(Math.max(0, Math.min(100, min)), Math.min(100, max)) : null
        };
      })
      .filter(Boolean);

    const seenGrades = new Set();
    sanitized.forEach((range) => {
      if (seenGrades.has(range.grade)) {
        validationErrors.push(`Gred ${range.grade} diduplikasi.`);
      } else {
        seenGrades.add(range.grade);
      }
    });

    const sorted = [...sanitized].sort((a, b) => a.min - b.min);

    if (sorted.length) {
      if (sorted[0].min > 0) {
        validationErrors.push('Julat gred mesti merangkumi markah 0.');
      }

      const last = sorted[sorted.length - 1];
      const lastMax = last.max ?? 100;
      if (lastMax < 100) {
        validationErrors.push('Julat gred mesti merangkumi markah 100.');
      }
    }

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const currentMax = current.max ?? 100;
      if (currentMax >= next.min) {
        validationErrors.push(`Julat gred ${current.grade} bertindih dengan gred ${next.grade}.`);
      }
      if (currentMax + 1 < next.min) {
        validationErrors.push(`Terdapat jurang antara markah ${currentMax} dan ${next.min - 1}.`);
      }
    }

    if (!sanitized.length) {
      validationErrors.push('Sekurang-kurangnya satu gred diperlukan.');
    }

    return { sanitized, validationErrors };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || isSaving) {
      return;
    }

    const { sanitized, validationErrors } = validateRanges();

    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors([]);
      await onSave(sanitized);
      setSubmitting(false);
    } catch (error) {
      const message =
        error?.errors?.join(', ') ||
        error?.message ||
        'Gagal menyimpan konfigurasi gred.';
      setErrors([message]);
      setSubmitting(false);
    }
  };

  const disableSave = submitting || isSaving;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="mosque-card w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-mosque-primary-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-mosque-primary-800">
            Konfigurasi Julat Gred
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-mosque-neutral-500 hover:text-mosque-neutral-700"
            disabled={disableSave}
          >
            <X size={24} />
          </button>
        </div>
        <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-sm text-emerald-800">
              <p>
                Tetapkan julat markah minimum dan maksimum bagi setiap gred. Sistem akan mengira gred secara automatik
                berdasarkan markah pelajar. Biarkan medan maksimum kosong untuk menandakan julat sehingga 100.
              </p>
            </div>

            <div className="space-y-4">
              {localRanges.map((range, index) => (
                <div
                  key={`grade-range-${index}-${range.grade}`}
                  className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gred</label>
                    <input
                      type="text"
                      value={range.grade}
                      onChange={(e) => handleRangeChange(index, 'grade', e.target.value.toUpperCase())}
                      placeholder="cth: A+"
                      className="input-mosque w-full uppercase"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Markah Min</label>
                    <input
                      type="number"
                      value={range.min}
                      onChange={(e) => handleRangeChange(index, 'min', e.target.value)}
                      placeholder="cth: 90"
                      className="input-mosque w-full"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Markah Maks</label>
                    <input
                      type="number"
                      value={range.max}
                      onChange={(e) => handleRangeChange(index, 'max', e.target.value)}
                      placeholder="cth: 100 atau kosong"
                      className="input-mosque w-full"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Julat</label>
                    <div className="input-mosque w-full bg-gray-100 text-gray-700">
                      {(() => {
                        const preview = sanitizedPreview[index];
                        if (!preview) {
                          return '-';
                        }
                        const min = !Number.isNaN(preview.min) ? preview.min : '-';
                        const max =
                          preview.max === null || Number.isNaN(preview.max)
                            ? '100'
                            : preview.max;
                        return `${min} - ${max}`;
                      })()}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveRange(index)}
                      className="inline-flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
                      disabled={localRanges.length <= 1}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Buang
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddRange}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Gred
            </button>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-2 text-sm text-red-700">
                <div className="flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Terdapat ralat pada konfigurasi gred:</span>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={`grade-error-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="p-6 bg-mosque-neutral-50 border-t border-mosque-primary-100 flex justify-end space-x-4">
            <button
              type="button"
              className="btn-mosque-secondary"
              onClick={onClose}
              disabled={disableSave}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-mosque-primary"
              disabled={disableSave}
            >
              {disableSave ? 'Menyimpan...' : 'Simpan Julat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeSettingsModal;


