import React from 'react';
import { Calendar } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

/**
 * Reusable calendar-style picker for date and/or month+year.
 * - mode="date": single date input (day, month, year)
 * - mode="month-year": month dropdown + year dropdown (no day)
 */
export function DateYearPicker({
  mode = 'month-year',
  value = null,
  onChange,
  minDate,
  maxDate,
  minYear,
  maxYear,
  showAllOption = true,
  labelMonth = 'Bulan',
  labelYear = 'Tahun',
  labelDate = 'Tarikh',
  className = '',
  id,
  inline = false,
}) {
  const currentYear = new Date().getFullYear();
  const minY = minYear ?? currentYear - 10;
  const maxY = maxYear ?? currentYear + 2;
  const years = Array.from({ length: maxY - minY + 1 }, (_, i) => maxY - i);

  if (mode === 'date') {
    const dateValue = value && (value instanceof Date || typeof value === 'string')
      ? (typeof value === 'string' ? value : value.toISOString().split('T')[0])
      : '';
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <label htmlFor={id || 'date-picker'} className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          {labelDate}
        </label>
        <input
          id={id || 'date-picker'}
          type="date"
          value={dateValue}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            const v = e.target.value;
            if (onChange) onChange(v ? new Date(v) : null);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
    );
  }

  // month-year mode
  const month = value?.month ?? value?.bulan ?? (showAllOption ? 'semua' : MONTH_NAMES[new Date().getMonth()]);
  const year = value?.year ?? value?.tahun ?? (showAllOption ? 'semua' : currentYear);

  const handleMonthChange = (e) => {
    const m = e.target.value;
    const y = m === 'semua' && showAllOption ? (year === 'semua' ? 'semua' : year) : (year === 'semua' ? currentYear : year);
    if (onChange) onChange({ bulan: m === 'semua' ? '' : m, tahun: y === 'semua' ? '' : Number(y) });
  };

  const handleYearChange = (e) => {
    const y = e.target.value;
    const m = month === 'semua' ? MONTH_NAMES[new Date().getMonth()] : month;
    if (onChange) onChange({ bulan: month === 'semua' ? '' : month, tahun: y === 'semua' ? '' : Number(y) });
  };

  const inputClass = 'px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-[38px]';

  if (inline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
        <select
          id={id ? `${id}-month` : 'month-picker'}
          value={month}
          onChange={handleMonthChange}
          aria-label={labelMonth}
          className={`${inputClass} min-w-[130px]`}
        >
          {showAllOption && <option value="semua">Semua Bulan</option>}
          {MONTH_NAMES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          id={id ? `${id}-year` : 'year-picker'}
          value={year}
          onChange={handleYearChange}
          aria-label={labelYear}
          className={`${inputClass} min-w-[95px]`}
        >
          {showAllOption && <option value="semua">Semua Tahun</option>}
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      <div className="flex flex-col gap-1">
        <label htmlFor={id ? `${id}-month` : 'month-picker'} className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          {labelMonth}
        </label>
        <select
          id={id ? `${id}-month` : 'month-picker'}
          value={month}
          onChange={handleMonthChange}
          className={`${inputClass} min-w-[140px]`}
        >
          {showAllOption && <option value="semua">Semua Bulan</option>}
          {MONTH_NAMES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id ? `${id}-year` : 'year-picker'} className="text-sm font-medium text-gray-700">
          {labelYear}
        </label>
        <select
          id={id ? `${id}-year` : 'year-picker'}
          value={year}
          onChange={handleYearChange}
          className={`${inputClass} min-w-[100px]`}
        >
          {showAllOption && <option value="semua">Semua Tahun</option>}
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Standalone date-only picker (single input).
 */
export function DatePicker({ value, onChange, min, max, label = 'Tarikh', className = '' }) {
  const dateValue = value && (value instanceof Date || typeof value === 'string')
    ? (typeof value === 'string' ? value : value.toISOString().split('T')[0])
    : '';
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        {label}
      </label>
      <input
        type="date"
        value={dateValue}
        min={min}
        max={max}
        onChange={(e) => {
          const v = e.target.value;
          if (onChange) onChange(v || null);
        }}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />
    </div>
  );
}

export default DateYearPicker;
