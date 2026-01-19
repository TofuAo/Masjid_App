import React, { useState, useEffect } from 'react';
import { attendanceAPI, feesAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  Eye,
  Download,
} from 'lucide-react';
import { getEffectiveRole } from '../utils/userRoles';

const createRange = (days = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));

  const format = (value) => value.toISOString().split('T')[0];

  return {
    start: format(startDate),
    end: format(endDate),
    label: `Paparan ${days} hari terakhir (${format(startDate)} — ${format(endDate)})`,
    startDate,
    endDate
  };
};

const isWithinRange = (value, rangeStart, rangeEnd) => {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= rangeStart && parsed <= rangeEnd;
};

const Account = () => {
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [rangeLabel, setRangeLabel] = useState('');
  

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      fetchData(userData.ic);
      const effectiveRole = getEffectiveRole(userData);
    }
  }, []);

  const fetchData = async (studentIC) => {
    setLoading(true);
    try {
      const range = createRange(30);
      setRangeLabel(range.label);

      // Fetch attendance records
      const attendanceData = await attendanceAPI.getAll({
        student_ic: studentIC,
        limit: 1000,
        start_date: range.start,
        end_date: range.end
      });
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);

      // Fetch fees/payment receipts
      const feesData = await feesAPI.getAll({
        student_ic: studentIC,
        limit: 1000
      });
      const normalizedFees = Array.isArray(feesData) ? feesData : [];
      const filteredFees = normalizedFees.filter(fee =>
        isWithinRange(fee.tarikh || fee.created_at || fee.updated_at, range.startDate, range.endDate)
      );
      setFees(filteredFees);
    } catch (error) {
      console.error('Error fetching account data:', error);
      toast.error('Gagal memuatkan data akaun.');
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status) => {
    const statusConfig = {
      'Hadir': { variant: 'success', label: 'Hadir', icon: <CheckCircle className="w-4 h-4" /> },
      'Tidak Hadir': { variant: 'danger', label: 'Tidak Hadir', icon: <XCircle className="w-4 h-4" /> },
      'Cuti': { variant: 'secondary', label: 'Cuti', icon: <Calendar className="w-4 h-4" /> },
      'Lewat': { variant: 'warning', label: 'Lewat', icon: <Clock className="w-4 h-4" /> },
      'Sakit': { variant: 'info', label: 'Sakit', icon: <AlertCircle className="w-4 h-4" /> },
      'terbayar': { variant: 'success', label: 'Terbayar', icon: <CheckCircle className="w-4 h-4" /> },
      'Bayar': { variant: 'success', label: 'Terbayar', icon: <CheckCircle className="w-4 h-4" /> },
      'tunggak': { variant: 'danger', label: 'Tunggak', icon: <XCircle className="w-4 h-4" /> },
      'Belum Bayar': { variant: 'danger', label: 'Belum Bayar', icon: <XCircle className="w-4 h-4" /> },
      'pending': { variant: 'warning', label: 'Menunggu', icon: <Clock className="w-4 h-4" /> },
    };
    const config = statusConfig[status] || { variant: 'default', label: status || 'Unknown', icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }
    // Assume it's a relative path from uploads folder
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${apiBaseUrl}/${imagePath}`;
  };

  const handleImageClick = (imagePath) => {
    const imageUrl = getImageUrl(imagePath);
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setImageModalOpen(true);
    }
  };

  const downloadImage = (imagePath, filename) => {
    const imageUrl = getImageUrl(imagePath);
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename || 'document.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiada Data Pengguna</h3>
        <p className="text-gray-600">Sila log masuk untuk melihat maklumat akaun anda.</p>
      </div>
    );
  }

  const effectiveRole = getEffectiveRole(user);
  const isStudent = effectiveRole === 'student';

  // Show all attendance and fee records; highlight proof availability
  const attendanceRecords = attendance;
  const feeRecords = fees;

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <Card.Header>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <Card.Title>{user.nama || 'Pengguna'}</Card.Title>
              <p className="text-sm text-gray-600 mt-1">
                IC: {user.ic_formatted || user.ic}
              </p>
              {user.email && (
                <p className="text-sm text-gray-600">{user.email}</p>
              )}
            </div>
          </div>
        </Card.Header>
      </Card>

      {/* Tabs */}
      <Card>
        <Card.Header>
          <div className="border-b border-gray-200 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex space-x-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'attendance'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Kehadiran ({attendanceRecords.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'payments'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Resit Pembayaran ({feeRecords.length})</span>
                  </div>
                </button>
              </div>
              {rangeLabel && (
                <div className="text-xs text-gray-500">{rangeLabel}</div>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada rekod kehadiran untuk dipaparkan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarikh
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kelas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bukti
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Dokumen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tindakan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {new Date(record.tarikh).toLocaleDateString('ms-MY')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {record.nama_kelas || record.kelas_nama || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.proof_image ? (
                              <div className="flex items-center space-x-2">
                                <ImageIcon className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-gray-600">Ada</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-600 opacity-70">Tiada bukti</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.document_confirmed ? (
                              <Badge variant="success" className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Telah Disahkan</span>
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Menunggu Pengesahan</span>
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.proof_image ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleImageClick(record.proof_image)}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Lihat</span>
                                </button>
                                <button
                                  onClick={() => downloadImage(record.proof_image, `attendance_${record.id}.jpg`)}
                                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Muat Turun</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Tiada tindakan</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {feeRecords.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada rekod pembayaran untuk dipaparkan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bulan/Tahun
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No. Resit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Dokumen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tindakan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {feeRecords.map((fee) => (
                        <tr key={fee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {fee.bulan} {fee.tahun}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            RM {parseFloat(fee.jumlah || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(fee.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {fee.no_resit || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {fee.document_confirmed ? (
                              <Badge variant="success" className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Telah Disahkan</span>
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Menunggu Pengesahan</span>
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {fee.resit_img ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleImageClick(fee.resit_img)}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Lihat</span>
                                </button>
                                <button
                                  onClick={() => downloadImage(fee.resit_img, `receipt_${fee.id}.jpg`)}
                                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Muat Turun</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Tiada tindakan</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </Card.Content>
      </Card>

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setImageModalOpen(false)}>
          <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Pratonton Dokumen</h3>
                <button
                  onClick={() => setImageModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <img
                src={selectedImage}
                alt="Document"
                className="max-w-full max-h-[80vh] mx-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;

