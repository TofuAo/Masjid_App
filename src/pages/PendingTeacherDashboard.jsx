import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, User, FileText, Mail, Phone, AlertCircle, BookOpen, Upload, Settings, HelpCircle, MessageSquare } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const PendingTeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      checkProfileComplete();
    } else {
      setLoading(false);
    }
  }, []);

  const checkProfileComplete = async () => {
    try {
      const response = await authAPI.checkProfileComplete();
      if (response.success) {
        setProfileComplete(response.data.isComplete);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Menunggu Kelulusan
            </h1>
            <p className="text-gray-700 mb-4">
              Akaun anda sedang menunggu kelulusan daripada pentadbir. Sila lengkapkan profil anda dan muat naik dokumen yang diperlukan.
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="warning" className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Status: Menunggu Kelulusan</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/complete-profile" className="block">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Lengkapkan Profil
                </h3>
                <p className="text-sm text-gray-600">
                  {profileComplete ? 'Profil lengkap' : 'Lengkapkan maklumat anda'}
                </p>
              </div>
              {!profileComplete && (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/pending-teacher/documents" className="block">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Muat Naik Dokumen
                </h3>
                <p className="text-sm text-gray-600">
                  Sijil, resume, dan dokumen lain
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/help" className="block">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Panduan Sistem
                </h3>
                <p className="text-sm text-gray-600">
                  Baca panduan penggunaan
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/contact" className="block">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Hubungi Pentadbir
                </h3>
                <p className="text-sm text-gray-600">
                  Hantar mesej atau soalan
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/personal-settings" className="block">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Tetapan Akaun
                </h3>
                <p className="text-sm text-gray-600">
                  Tukar kata laluan
                </p>
              </div>
            </div>
          </Link>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-emerald-600" />
            Apa yang anda boleh lakukan
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Log masuk dan akses dashboard</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Lengkapkan profil peribadi</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Muat naik dokumen yang diperlukan</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Baca panduan sistem (baca sahaja)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Hubungi pentadbir untuk bantuan</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Tukar kata laluan</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <XCircle className="w-5 h-5 mr-2 text-red-600" />
            Apa yang anda tidak boleh lakukan
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Akses data pelajar</span>
            </li>
            <li className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Akses kelas atau jadual</span>
            </li>
            <li className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Ambil kehadiran pelajar</span>
            </li>
            <li className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Masukkan keputusan</span>
            </li>
            <li className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Hantar pengumuman</span>
            </li>
            <li className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Lihat guru lain</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Status Flow Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Aliran Status
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-700">Menunggu</p>
            <p className="text-xs text-gray-500">Status semasa</p>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-gray-300 rounded"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-700">Diluluskan</p>
            <p className="text-xs text-gray-500">Akses penuh</p>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-gray-300 rounded"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-700">Ditolak</p>
            <p className="text-xs text-gray-500">Akses terhad / mohon semula</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PendingTeacherDashboard;
