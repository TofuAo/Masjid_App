import React, { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

/**
 * FileDropZone - Drag-and-drop file upload area with click fallback.
 * Uses native HTML5 DnD for OS file drops; supports multiple files, validation, progress.
 */
const FileDropZone = ({
  onFiles,
  onError,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  maxCount = 1,
  multiple = false,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  error = null,
  hint = null,
  dropLabel = 'Lepaskan fail di sini atau klik untuk pilih',
  idleLabel = 'Seret fail ke sini atau klik untuk pilih',
  className = '',
  children,
}) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const validateFiles = useCallback(
    (files) => {
      const list = Array.from(files || []);
      const allowed = accept ? accept.split(',').map((a) => a.trim()) : [];
      const maxBytes = maxSize;
      const errors = [];
      const valid = [];

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        if (allowed.length && !allowed.some((a) => a === '*' || a === 'image/*' || file.type === a || file.type.startsWith(a.replace('/*', '/')))) {
          errors.push(`${file.name}: format tidak disokong`);
          continue;
        }
        if (file.size > maxBytes) {
          errors.push(`${file.name}: saiz melebihi ${Math.round(maxBytes / 1024 / 1024)}MB`);
          continue;
        }
        valid.push(file);
      }

      const capped = multiple ? valid.slice(0, maxCount) : valid.slice(0, 1);
      return { files: capped, errors };
    },
    [accept, maxSize, maxCount, multiple]
  );

  const handleFiles = useCallback(
    (files) => {
      if (!files?.length || disabled || uploading) return;
      const { files: valid, errors } = validateFiles(files);
      if (valid.length) onFiles(multiple ? valid : valid[0]);
      if (errors.length && onError) onError(errors.join('; '));
    },
    [disabled, uploading, multiple, onFiles, validateFiles]
  );

  const onDragEnter = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || uploading) return;
      dragCounterRef.current += 1;
      if (e.dataTransfer?.items?.length) setIsDragOver(true);
    },
    [disabled, uploading]
  );

  const onDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || uploading) return;
      e.dataTransfer.dropEffect = 'copy';
    },
    [disabled, uploading]
  );

  const onDragLeave = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) setIsDragOver(false);
    },
    []
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      if (disabled || uploading) return;
      const files = e.dataTransfer?.files;
      if (files?.length) handleFiles(files);
    },
    [disabled, uploading, handleFiles]
  );

  const onClick = useCallback(() => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  }, [disabled, uploading]);

  const onInputChange = useCallback(
    (e) => {
      const files = e.target.files;
      if (files?.length) handleFiles(files);
      e.target.value = '';
    },
    [handleFiles]
  );

  const label = isDragOver ? dropLabel : idleLabel;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
        ${isDragOver ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30' : 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50'}
        ${disabled || uploading ? 'opacity-60 pointer-events-none' : ''}
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onInputChange}
        className="hidden"
        disabled={disabled || uploading}
        aria-hidden="true"
      />
      {children ? (
        children
      ) : (
        <>
          <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
          {uploading && (
            <div className="mt-3 w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        </>
      )}
    </div>
  );
};

export default FileDropZone;
