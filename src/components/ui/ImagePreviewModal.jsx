/**
 * ImagePreviewModal — Modal for viewing a single image (e.g. document proof).
 *
 * UX/UI design:
 * - Clear hierarchy: header (title + close) → body (image) → optional footer (actions).
 * - Image is centered in a constrained area with object-contain so aspect ratio is preserved
 *   and the image never overflows; sizing uses max dimensions and responsive padding.
 * - Readability: sufficient contrast, spacing, and focus states; accessible close and actions.
 * - Responsive: modal and image scale down on small screens; touch-friendly hit areas.
 */
import React, { useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import Button from './Button';

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = 'Document',
  title = 'Pratonton Dokumen',
  downloadFilename = null,
  onDownload = null,
}) {
  const closeButtonRef = useRef(null);

  // Focus close button when modal opens; trap focus would be an optional enhancement
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

  const showDownload = onDownload && downloadFilename;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-modal-title"
    >
      <div
        className="flex flex-col bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: title + close */}
        <div className="flex items-center justify-between flex-shrink-0 gap-4 px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200">
          <h2
            id="image-preview-modal-title"
            className="text-base sm:text-lg font-semibold text-gray-900 truncate"
          >
            {title}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {showDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" aria-hidden />
                <span>Muat turun</span>
              </Button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-6 h-6" aria-hidden />
            </button>
          </div>
        </div>

        {/* Body: image only — correct placement and sizing */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 bg-gray-50/80">
          <div className="relative w-full h-full min-h-[200px] max-h-[calc(90vh-8rem)] flex items-center justify-center">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-sm"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
