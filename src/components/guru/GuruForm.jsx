import React, { useState, useEffect } from 'react';
import BackButton from '../ui/BackButton';
import { formatIC } from '../../utils/icUtils';
import { formatPhone } from '../../utils/phoneUtils';
import { classesAPI } from '../../services/api';

const GuruForm = ({ guru = null, onSubmit, onCancel, user = null }) => {
  const kepakaranOptions = [
    'Al-Quran', 'Tajwid', 'Fardhu Ain', 'Hadith', 'Fiqh', 'Seerah',
    'Tafsir', 'Bahasa Arab', 'Akidah', 'Tasawwuf'
  ];

  const [formData, setFormData] = useState({
    nama: '',
    ic: '',
    telefon: '',
    kepakaran: [],
    email: '',
    password: '',
    kelas_ids: [] // Array of class IDs
  });

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Fetch classes on component mount - Only for admin/PIC
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn('[GuruForm] No auth token found');
          setLoadingClasses(false);
          return;
        }
        
        // Check if user is admin or PIC - only fetch for them
        const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = currentUser?.role;
        
        if (userRole !== 'admin' && userRole !== 'pic') {
          console.log('[GuruForm] User is not admin/PIC, skipping class fetch');
          setLoadingClasses(false);
          setClasses([]);
          return;
        }
        
        console.log('[GuruForm] Fetching classes for admin/PIC...');
        const response = await classesAPI.getAll({ limit: 1000 });
        let classesList = [];
        
        if (Array.isArray(response)) {
          classesList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          classesList = response.data;
        }
        
        // Filter classes: only show classes with no teacher assigned
        // OR classes already assigned to this teacher (if editing)
        const currentTeacherIC = guru?.telefon || guru?.IC || null;
        const filteredClasses = classesList.filter(kelas => {
          // Show classes with no teacher (guru_telefon is null, undefined, or empty string)
          const hasNoTeacher = !kelas.guru_telefon || kelas.guru_telefon === null || kelas.guru_telefon === '';
          
          // If editing a teacher, also show classes already assigned to this teacher
          // This allows the admin to see and manage classes already assigned to this teacher
          const isAssignedToThisTeacher = currentTeacherIC && (
            kelas.guru_telefon === currentTeacherIC || 
            kelas.guru_telefon === currentTeacherIC.replace(/-/g, '') ||
            kelas.guru_telefon?.replace(/-/g, '') === currentTeacherIC.replace(/-/g, '')
          );
          
          return hasNoTeacher || isAssignedToThisTeacher;
        });
        
        console.log('[GuruForm] Classes fetched:', classesList.length, 'Unassigned/This teacher:', filteredClasses.length);
        setClasses(filteredClasses);
      } catch (error) {
        console.error('[GuruForm] Error fetching classes:', error);
        setClasses([]); // Set empty array on error
      } finally {
        setLoadingClasses(false);
      }
    };
    
    fetchClasses();
  }, [user, guru]);

  // Initialize form data and filter invalid expertise when guru prop changes
  useEffect(() => {
    if (guru) {
      // Filter out invalid expertise values (like "Lanjutan" which is a class level, not expertise)
      const validKepakaran = Array.isArray(guru.kepakaran) 
        ? guru.kepakaran.filter(k => kepakaranOptions.includes(k))
        : [];
      
      // Get IC and ensure it's valid (12 digits)
      let teacherIC = guru.telefon || guru.IC || '';
      // Normalize IC to check if it's valid
      const normalizedIC = teacherIC.replace(/\D/g, '');
      // If normalized IC is not 12 digits, keep the original for display but it will be validated on submit
      // Format IC with hyphens for display
      if (normalizedIC.length === 12) {
        teacherIC = `${normalizedIC.slice(0, 6)}-${normalizedIC.slice(6, 8)}-${normalizedIC.slice(8, 12)}`;
      }
      
      // Get classes assigned to this teacher
      const teacherClasses = guru.classes || [];
      const kelasIds = teacherClasses.map(c => c.id || c.kelas_id).filter(id => id != null);
      
      setFormData({
        nama: guru.nama || '',
        ic: teacherIC,
        telefon: guru.telefon || '',
        kepakaran: validKepakaran,
        email: guru.email || '',
        password: '',
        kelas_ids: kelasIds
      });
    } else {
      // Reset form for new teacher
      setFormData({
        nama: '',
        ic: '',
        telefon: '',
        kepakaran: [],
        email: '',
        password: '',
        kelas_ids: []
      });
    }
  }, [guru]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ic' ? formatIC(value, true) : // Auto-format IC with hyphens
              name === 'telefon' ? formatPhone(value, true) : // Auto-format phone with hyphen
              value
    }));
  };

  const handleKepakaranChange = (kepakaran) => {
    setFormData(prev => ({
      ...prev,
      kepakaran: prev.kepakaran.includes(kepakaran)
        ? prev.kepakaran.filter(k => k !== kepakaran)
        : [...prev.kepakaran, kepakaran]
    }));
  };

  const handleClassChange = (classId) => {
    setFormData(prev => ({
      ...prev,
      kelas_ids: prev.kelas_ids.includes(classId)
        ? prev.kelas_ids.filter(id => id !== classId)
        : [...prev.kelas_ids, classId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[GuruForm] Original formData:', formData);
    
    // Filter out invalid expertise values (only keep valid ones)
    const validKepakaran = formData.kepakaran.filter(k => kepakaranOptions.includes(k));
    
    // Client-side validation
    if (validKepakaran.length === 0) {
      alert('Sila pilih sekurang-kurangnya satu kepakaran yang sah.');
      return;
    }
    
    // Validate IC is required
    if (!formData.ic|| formData.ic.trim() === '') {
      alert('Nombor IC diperlukan.');
      return;
    }
    
    // Normalize IC (remove hyphens for validation)
    const normalizedIC = formData.ic.replace(/\D/g, '');
    
    // Validate IC format (must be exactly 12 digits)
    if (normalizedIC.length !== 12) {
      alert('Nombor IC mesti mengandungi 12 digit dalam format: XXXXXX-XX-XXXX');
      return;
    }
    
    // Build submit data
    const submitData = {
      nama: formData.nama,
      ic: normalizedIC,
      telefon: formData.telefon || '',
      kepakaran: validKepakaran,
      kelas_ids: formData.kelas_ids || [] // Include selected class IDs
    };
    
    // Add optional fields only if provided
    if (formData.email && formData.email.trim() !== '') {
      submitData.email = formData.email.trim();
    }

    if (formData.password && formData.password.trim() !== '') {
      submitData.password = formData.password.trim();
    }

    // Remove empty kelas_ids array if no classes selected
    if (!submitData.kelas_ids || submitData.kelas_ids.length === 0) {
      delete submitData.kelas_ids;
    }

    // Log to verify data before submission
    console.log('[GuruForm] Submitting teacher data:', JSON.stringify(submitData, null, 2));
    
    onSubmit(submitData);
  };

  return (
    <div className="mosque-card">
      <div className="p-6 border-b border-mosque-primary-100">
        <div className="flex items-center space-x-3">
          <BackButton onClick={onCancel} />
          <h3 className="text-xl font-bold text-mosque-primary-800">
            {guru ? 'Kemaskini Maklumat Guru' : 'Tambah Guru Baru'}
          </h3>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Nama Penuh *</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                className="input-mosque w-full"
                placeholder="Masukkan nama penuh"
              />
            </div>
            <div>
              <label className="form-label">Nombor IC *</label>
              <input
                type="text"
                name="ic"
                value={formData.ic}
                onChange={handleChange}
                required
                maxLength={14}
                autoComplete="off"
                className="input-mosque w-full"
                placeholder="Contoh: 123456-78-9012"
              />
              <p className="text-xs text-gray-500 mt-1">Format: XXXXXX-XX-XXXX (12 digit dengan sempang)</p>
            </div>
            <div>
              <label className="form-label">Nombor Telefon</label>
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                maxLength={12}
                autoComplete="tel"
                className="input-mosque w-full"
                placeholder="Contoh: 012-3456789 atau 0123456789"
              />
              <p className="text-xs text-gray-500 mt-1">Format: 01X diikuti 7-8 digit (dengan atau tanpa sempang)</p>
            </div>
          </div>
          <div>
            <label className="form-label">Kepakaran *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
              {kepakaranOptions.map((kepakaran) => (
                <label key={kepakaran} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.kepakaran.includes(kepakaran)}
                    onChange={() => handleKepakaranChange(kepakaran)}
                    className="h-4 w-4 rounded border-mosque-neutral-300 text-mosque-primary-600 focus:ring-mosque-primary-500"
                  />
                  <span className="text-sm text-mosque-neutral-700">{kepakaran}</span>
                </label>
              ))}
            </div>
            {formData.kepakaran.length > 0 && (
              <div className="mt-4 p-3 bg-mosque-primary-50 rounded-lg">
                <p className="text-sm font-medium text-mosque-primary-800 mb-2">Kepakaran dipilih:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.kepakaran.map((kepakaran) => (
                    <span key={kepakaran} className="badge-education">
                      {kepakaran}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* ========== KELAS YANG DIAMPU SECTION - FOR ADMIN/PIC ONLY ========== */}
          {(() => {
            const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
            const userRole = currentUser?.role;
            const isAdminOrPIC = userRole === 'admin' || userRole === 'pic';
            
            if (!isAdminOrPIC) {
              return null; // Don't show for non-admin users
            }
            
            return (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-300 shadow-md" style={{ display: 'block', visibility: 'visible' }}>
            <div className="mb-3">
              <label className="form-label block mb-1 text-lg font-bold">
                📚 Kelas yang Boleh Diampu <span className="text-gray-500 font-normal">(Pilihan - Boleh pilih banyak)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Sila pilih kelas yang akan diampu oleh guru ini. Guru boleh mengendalikan lebih daripada satu kelas.
              </p>
            </div>
            
            {/* Show currently assigned classes if editing */}
            {guru && (() => {
              const currentTeacherIC = guru?.telefon || guru?.IC || null;
              const currentlyAssignedClasses = classes.filter(kelas => {
                if (!currentTeacherIC) return false;
                return kelas.guru_telefon === currentTeacherIC || 
                       kelas.guru_telefon === currentTeacherIC.replace(/-/g, '') ||
                       kelas.guru_telefon?.replace(/-/g, '') === currentTeacherIC.replace(/-/g, '');
              });
              
              if (currentlyAssignedClasses.length > 0) {
                return (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-sm font-semibold text-blue-800 mb-2">
                      📋 Kelas yang Sedang Diampu ({currentlyAssignedClasses.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentlyAssignedClasses.map(kelas => (
                        <span 
                          key={kelas.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white"
                        >
                          {kelas.nama_kelas || kelas.nama}
                          {kelas.level && (
                            <span className="ml-1 text-xs opacity-90">({kelas.level})</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Kelas-kelas ini sedang diampu oleh guru ini. Anda boleh mengekalkan atau menukar pilihan.
                    </p>
                  </div>
                );
              }
              return null;
            })()}
            {loadingClasses ? (
              <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 text-center">Memuatkan kelas...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mt-2 max-h-60 overflow-y-auto border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                  {classes.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Tiada kelas tersedia</p>
                      <p className="text-xs text-gray-600 mt-1">Sila tambah kelas terlebih dahulu</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {classes.map((kelas) => (
                        <label 
                          key={kelas.id} 
                          className="flex items-center space-x-3 cursor-pointer hover:bg-emerald-50 p-3 rounded-lg border border-transparent hover:border-emerald-200 transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={formData.kelas_ids.includes(kelas.id)}
                            onChange={() => handleClassChange(kelas.id)}
                            className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">
                              {kelas.nama_kelas || kelas.nama}
                            </span>
                            {kelas.level && (
                              <span className="text-xs text-gray-500 ml-2">({kelas.level})</span>
                            )}
                            {kelas.kapasiti && (
                              <span className="text-xs text-gray-600 ml-2">• Kapasiti: {kelas.kapasiti}</span>
                            )}
                          </div>
                          {formData.kelas_ids.includes(kelas.id) && (
                            <span className="text-emerald-600 text-xs font-medium">✓ Dipilih</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.kelas_ids.length > 0 && (
                  <div className="mt-3 p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                    <p className="text-sm font-semibold text-emerald-800 mb-3">
                      ✓ {formData.kelas_ids.length} Kelas Dipilih untuk Diampu:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.kelas_ids.map((classId) => {
                        const selectedClass = classes.find(c => c.id === classId);
                        const currentTeacherIC = guru?.telefon || guru?.IC || null;
                        const isCurrentlyAssigned = currentTeacherIC && selectedClass && (
                          selectedClass.guru_telefon === currentTeacherIC || 
                          selectedClass.guru_telefon === currentTeacherIC.replace(/-/g, '') ||
                          selectedClass.guru_telefon?.replace(/-/g, '') === currentTeacherIC.replace(/-/g, '')
                        );
                        return selectedClass ? (
                          <span 
                            key={classId} 
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              isCurrentlyAssigned 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {selectedClass.nama_kelas || selectedClass.nama}
                            {selectedClass.level && (
                              <span className="ml-1 text-xs opacity-90">({selectedClass.level})</span>
                            )}
                            {isCurrentlyAssigned && (
                              <span className="ml-1 text-xs opacity-90">(Sedang diampu)</span>
                            )}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {formData.kelas_ids.length === 0 && classes.length > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700">
                      💡 Tip: Pilih kelas yang boleh diampu oleh guru ini. Ini adalah pilihan - guru boleh ditambah tanpa kelas.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
            );
          })()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Email {guru ? '(Kosongkan jika tidak mahu menukar)' : '(Pilihan)'}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required={false}
                autoComplete="email"
                className="input-mosque w-full"
                placeholder={guru ? "Kosongkan jika tidak mahu menukar email" : "Masukkan email (pilihan)"}
              />
              {guru ? (
                <p className="text-xs text-gray-500 mt-1">Biarkan kosong untuk mengekalkan email semasa</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Email adalah pilihan (tidak wajib)</p>
              )}
            </div>
            <div>
              <label className="form-label">Password {guru ? '(Kosongkan jika tidak mahu menukar)' : '*'}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!guru}
                minLength={guru ? 0 : 5}
                autoComplete="new-password"
                className="input-mosque w-full"
                placeholder={guru ? "Kosongkan jika tidak mahu menukar password" : "Masukkan password"}
              />
              {guru && (
                <p className="text-xs text-gray-500 mt-1">Biarkan kosong untuk mengekalkan password semasa</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 bg-mosque-neutral-50 border-t border-mosque-primary-100 flex justify-end space-x-4">
          <button type="button" className="btn-mosque-secondary" onClick={onCancel}>
            Batal
          </button>
          <button type="submit" className="btn-mosque-primary">
            {guru ? 'Kemaskini' : 'Tambah Guru'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuruForm;
