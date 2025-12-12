import React, { useState, useEffect } from 'react';
import { X, BookOpen, Video, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const WelcomeModal = ({ user, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const userRole = user?.activeRole || user?.role || 'student';

  const steps = [
    {
      title: 'Selamat Datang!',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Terima kasih kerana menggunakan Sistem Pengurusan Masjid. Kami akan membantu anda memulakan perjalanan anda.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Anda boleh melangkau tutorial ini pada bila-bila masa dengan menutup modal ini.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Kenali Dashboard',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Dashboard adalah halaman utama anda. Di sini anda akan melihat:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Statistik penting tentang sistem atau akaun anda</li>
            <li>Pengumuman dari pentadbir</li>
            <li>Aktiviti terkini</li>
            <li>Pautan pantas ke fungsi utama</li>
          </ul>
        </div>
      )
    },
    {
      title: userRole === 'student' ? 'Untuk Pelajar' : userRole === 'teacher' ? 'Untuk Guru' : 'Untuk Pentadbir',
      content: (
        <div className="space-y-4">
          {userRole === 'student' && (
            <>
              <p className="text-gray-700">Sebagai pelajar, anda boleh:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Lihat rekod kehadiran anda</li>
                <li>Lihat keputusan peperiksaan</li>
                <li>Bayar yuran secara dalam talian</li>
                <li>Baca pengumuman penting</li>
              </ul>
            </>
          )}
          {userRole === 'teacher' && (
            <>
              <p className="text-gray-700">Sebagai guru, anda boleh:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Tandakan kehadiran pelajar</li>
                <li>Masukkan keputusan peperiksaan</li>
                <li>Lihat senarai pelajar kelas anda</li>
                <li>Pantau prestasi pelajar</li>
              </ul>
            </>
          )}
          {userRole === 'admin' && (
            <>
              <p className="text-gray-700">Sebagai pentadbir, anda boleh:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Urus pelajar, guru, dan kelas</li>
                <li>Lihat semua rekod dan laporan</li>
                <li>Buat pengumuman</li>
                <li>Kelola pengguna dan tetapan sistem</li>
              </ul>
            </>
          )}
        </div>
      )
    },
    {
      title: 'Dapatkan Bantuan',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Perlu bantuan? Kami sentiasa di sini untuk membantu anda:
          </p>
          <div className="space-y-3">
            <Link
              to="/help"
              className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              onClick={onClose}
            >
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Pusat Bantuan</p>
                <p className="text-sm text-blue-700">Cari jawapan untuk soalan anda</p>
              </div>
            </Link>
            <Link
              to="/contact"
              className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              onClick={onClose}
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Hubungi Kami</p>
                <p className="text-sm text-green-700">Hantar mesej kepada kami</p>
              </div>
            </Link>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Tip:</strong> Cari ikon <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-200 text-yellow-800 text-xs">?</span> di seluruh sistem untuk mendapatkan bantuan konteks.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleClose = () => {
    if (user?.ic) {
      if (dontShowAgain) {
        // Permanently disable if "don't show again" is checked
        localStorage.setItem(`onboarding_permanently_disabled_${user.ic}`, 'true');
        localStorage.removeItem(`onboarding_last_shown_${user.ic}`); // Clean up old timestamp
      } else {
        // Store timestamp of when modal was dismissed (to show again after 24 hours)
        localStorage.setItem(`onboarding_last_shown_${user.ic}`, Date.now().toString());
        localStorage.removeItem(`onboarding_permanently_disabled_${user.ic}`); // Ensure permanent disable is cleared
      }
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
            <p className="text-sm text-blue-100 mt-1">
              Langkah {currentStep + 1} daripada {steps.length}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-100 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            {steps[currentStep].content}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-lg border-t border-gray-200">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Jangan tunjukkan lagi</span>
            </label>
            <div className="flex space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Kembali
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>{currentStep === steps.length - 1 ? 'Mula' : 'Seterusnya'}</span>
                {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;

