import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Two-Step Delete Confirmation Modal
 * 
 * Step 1: Initial warning confirmation
 * Step 2: Type "DELETE" or "PADAM" to confirm deletion (based on language)
 */
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName = 'item',
  itemIdentifier = '',
  itemType = 'item',
  isLoading = false
}) => {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Use "PADAM" for Malay, "DELETE" for other languages
  const requiredText = language === 'ms' ? 'PADAM' : 'DELETE';
  const displayName = itemIdentifier || itemName;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmationText('');
      setIsConfirmed(false);
    }
  }, [isOpen]);

  // Check if confirmation text matches
  useEffect(() => {
    setIsConfirmed(confirmationText.trim().toUpperCase() === requiredText);
  }, [confirmationText]);

  if (!isOpen) return null;

  const handleStep1Confirm = () => {
    setStep(2);
  };

  const handleStep1Cancel = () => {
    setStep(1);
    setConfirmationText('');
    onClose();
  };

  const handleStep2Confirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  const handleStep2Cancel = () => {
    setStep(1);
    setConfirmationText('');
    setIsConfirmed(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={step === 1 ? handleStep1Cancel : undefined}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 1 ? 'Pengesahan Padam' : 'Pengesahan Muktamad'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Langkah {step} daripada 2
              </p>
            </div>
          </div>
          <button
            onClick={step === 1 ? handleStep1Cancel : handleStep2Cancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Initial Warning
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  ⚠️ Amaran: Tindakan ini tidak boleh dibatalkan
                </p>
                <p className="text-sm text-red-700">
                  Anda akan memadam <strong>{itemType}</strong> ini secara kekal:
                </p>
                <p className="text-sm font-semibold text-red-900 mt-2">
                  {displayName}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Perhatian:</strong> Semua data berkaitan akan turut dipadam, termasuk:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                  <li>Rekod kehadiran</li>
                  <li>Keputusan peperiksaan</li>
                  <li>Rekod yuran</li>
                  <li>Data lain yang berkaitan</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600">
                Adakah anda pasti mahu meneruskan?
              </p>
            </div>
          ) : (
            // Step 2: Type DELETE to confirm
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  🔴 Langkah Terakhir: Pengesahan Muktamad
                </p>
                <p className="text-sm text-red-700">
                  {language === 'ms' 
                    ? <>Untuk mengesahkan pemadaman, sila taip <strong>PADAM</strong> di bawah:</>
                    : <>To confirm deletion, please type <strong>DELETE</strong> below:</>
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ms' 
                    ? `Taip "PADAM" untuk mengesahkan:`
                    : `Type "DELETE" to confirm:`
                  }
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={language === 'ms' ? 'Taip PADAM di sini' : 'Type DELETE here'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                  disabled={isLoading}
                />
                {confirmationText && !isConfirmed && (
                  <p className="mt-1 text-xs text-red-600">
                    {language === 'ms' 
                      ? `Teks tidak sepadan. Sila taip "PADAM" dengan betul.`
                      : `Text does not match. Please type "DELETE" correctly.`
                    }
                  </p>
                )}
                {isConfirmed && (
                  <p className="mt-1 text-xs text-green-600">
                    {language === 'ms' 
                      ? `✓ Teks disahkan. Anda boleh meneruskan pemadaman.`
                      : `✓ Text confirmed. You can proceed with deletion.`
                    }
                  </p>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Item yang akan dipadam:</strong> {displayName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          {step === 1 ? (
            <>
              <button
                onClick={handleStep1Cancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleStep1Confirm}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Teruskan ke Langkah 2
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStep2Cancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                onClick={handleStep2Confirm}
                disabled={!isConfirmed || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memadam...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Padam Sekarang
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;

