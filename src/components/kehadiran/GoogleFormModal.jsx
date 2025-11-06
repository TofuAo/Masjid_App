import React, { useState, useEffect } from 'react';
import { X, ExternalLink, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const GoogleFormModal = ({ isOpen, onClose, formUrl, classId, className, selectedDate, onFormSubmit }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [checkingInterval, setCheckingInterval] = useState(null);

  useEffect(() => {
    if (isOpen && formUrl) {
      // Listen for messages from Google Form (if using embedded form)
      const handleMessage = (event) => {
        // Verify origin if needed
        if (event.data && event.data.type === 'google-form-submit') {
          handleFormSubmit(event.data);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check for form completion periodically (alternative approach)
      // This is a fallback - actual implementation should use webhook
      const interval = setInterval(() => {
        // Check localStorage or other indicators that form was submitted
        const formData = localStorage.getItem(`googleForm_${classId}_${selectedDate}`);
        if (formData) {
          try {
            const data = JSON.parse(formData);
            handleFormSubmit(data);
            localStorage.removeItem(`googleForm_${classId}_${selectedDate}`);
          } catch (e) {
            console.error('Error parsing form data:', e);
          }
        }
      }, 2000);

      setCheckingInterval(interval);

      return () => {
        window.removeEventListener('message', handleMessage);
        if (interval) clearInterval(interval);
      };
    }
  }, [isOpen, formUrl, classId, selectedDate]);

  const handleFormSubmit = (data) => {
    if (data && onFormSubmit) {
      onFormSubmit(data);
      setFormSubmitted(true);
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (formUrl) {
      window.open(formUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="mosque-card w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ambil Kehadiran - {className}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tarikh: {new Date(selectedDate).toLocaleDateString('ms-MY')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          {formSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kehadiran Berjaya Direkodkan!</h3>
              <p className="text-gray-600 mb-4">Data kehadiran telah diterima dan disimpan dalam sistem.</p>
              <Button onClick={onClose}>Tutup</Button>
            </div>
          ) : formUrl ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium mb-1">Arahan:</p>
                    <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Pilih nama pelajar yang hadir dalam borang di bawah</li>
                      <li>Tekan butang "Hantar" untuk menghantar kehadiran</li>
                      <li>Data akan disimpan secara automatik ke sistem</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  src={formUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  marginHeight="0"
                  marginWidth="0"
                  title="Google Form Kehadiran"
                  className="w-full h-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleOpenInNewTab}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka dalam Tab Baru
                </Button>
                <div className="text-xs text-gray-500">
                  Jika borang tidak dimuatkan, sila klik "Buka dalam Tab Baru"
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Pautan Google Form belum dikonfigurasi untuk kelas ini.
              </p>
              <p className="text-sm text-gray-500">
                Sila hubungi pentadbir untuk menambah pautan Google Form.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleFormModal;

