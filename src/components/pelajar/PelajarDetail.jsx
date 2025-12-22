import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import BackButton from '../ui/BackButton';
import Badge from '../ui/Badge';
import ReceiptViewer from '../receipt/ReceiptViewer';
import { User, Phone, MapPin, Calendar, BookOpen, Edit, FileText, Eye, ExternalLink, GraduationCap } from 'lucide-react';
import { formatIC } from '../../utils/icUtils';
import { formatPhoneForDisplay } from '../../utils/phoneUtils';
import { receiptAPI, studentsAPI } from '../../services/api';

const PelajarDetail = ({ pelajar, onEdit, onClose }) => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [studentData, setStudentData] = useState(pelajar);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Fetch fresh student data to ensure we have teacher information
  useEffect(() => {
    const fetchStudentData = async () => {
      if (pelajar && (pelajar.ic || pelajar.IC)) {
        const studentIc = pelajar.ic || pelajar.IC;
        try {
          setLoadingStudent(true);
          const response = await studentsAPI.getById(studentIc);
          console.log('Student data response:', response);
          
          // Handle different response structures
          let fetchedData = null;
          if (response?.success && response?.data) {
            fetchedData = response.data;
          } else if (response?.data) {
            fetchedData = response.data;
          } else if (response && typeof response === 'object' && !response.success) {
            // Direct data object
            fetchedData = response;
          }
          
          if (fetchedData) {
            console.log('Setting student data:', fetchedData);
            setStudentData(fetchedData);
          } else {
            console.warn('No student data found in response, using original pelajar data');
            setStudentData(pelajar);
          }
        } catch (error) {
          console.error('Failed to fetch student data:', error);
          // Fallback to original pelajar data if fetch fails
          setStudentData(pelajar);
        } finally {
          setLoadingStudent(false);
        }
      }
    };

    fetchStudentData();
  }, [pelajar]);

  useEffect(() => {
    if (studentData && (studentData.ic || studentData.IC)) {
      fetchReceipts();
    }
  }, [studentData]);

  const fetchReceipts = async () => {
    try {
      setLoadingReceipts(true);
      const studentIc = studentData.ic || studentData.IC;
      const response = await receiptAPI.getUserReceipts(studentIc);
      if (response?.success && response?.data) {
        setReceipts(response.data);
      } else {
        setReceipts([]);
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      setReceipts([]);
    } finally {
      setLoadingReceipts(false);
    }
  };

  const viewReceipt = (receipt) => {
    setSelectedReceipt({
      receiptNumber: receipt.no_resit,
      feeId: receipt.fee_id || null,
      paymentId: receipt.payment_id || null
    });
    setShowReceiptViewer(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  // Use studentData (fresh data) if available, otherwise fallback to pelajar
  const displayData = studentData || pelajar;
  
  if (!displayData) return null;

  // Get class name from API response, fallback to 'Tiada Kelas'
  const getKelasName = () => {
    return displayData.nama_kelas || 'Tiada Kelas';
  };

  // Handle class name click to navigate to class detail page
  const handleClassClick = () => {
    if (displayData.kelas_id) {
      navigate(`/kelas?view=detail&id=${displayData.kelas_id}`);
    }
  };

  // Format registration date safely
  const formatTarikhDaftar = () => {
    if (!displayData.tarikh_daftar) return '-';
    try {
      const date = new Date(displayData.tarikh_daftar);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('ms-MY');
    } catch (error) {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <BackButton onClick={onClose} />
          <h2 className="text-2xl font-bold text-gray-900">Maklumat Pelajar</h2>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button onClick={() => onEdit(displayData)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-600" />
                Maklumat Peribadi
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nama Penuh</label>
                  <p className="mt-1 text-sm text-gray-900">{displayData.nama}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombor IC</label>
                  <p className="mt-1 text-sm text-gray-900">{(displayData.IC || displayData.ic) ? formatIC(displayData.IC || displayData.ic, true) : '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Umur</label>
                  <p className="mt-1 text-sm text-gray-900">{displayData.umur} tahun</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
                Alamat & Hubungan
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Alamat</label>
                  <p className="mt-1 text-sm text-gray-900">{displayData.alamat}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombor Telefon</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-emerald-600" />
                    {formatPhoneForDisplay(displayData.telefon) || '-'}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Payment Receipts Section */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-600" />
                Payment Receipts
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {loadingReceipts ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading receipts...</p>
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No receipts found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Receipt: {receipt.no_resit || 'N/A'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatDate(receipt.tarikh_bayar)} • RM {parseFloat(receipt.jumlah || 0).toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewReceipt(receipt)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-emerald-600" />
                Maklumat Akademik
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Kelas</label>
                  {displayData.kelas_id ? (
                    <button
                      onClick={handleClassClick}
                      className="mt-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline flex items-center cursor-pointer"
                    >
                      {getKelasName()}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{getKelasName()}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Guru Kelas</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2 text-emerald-600" />
                    {loadingStudent ? 'Memuatkan...' : (displayData.guru_nama || 'Tiada Guru Ditetapkan')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tarikh Daftar</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                    {formatTarikhDaftar()}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Keputusan Peperiksaan ({pelajar.tahun})</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peperiksaan Akhir Tahun</span>
                  <span className="text-sm font-medium text-gray-900">A-</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Nota Penting</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  Pelajar menunjukkan kemajuan yang baik dalam pembelajaran Al-Quran
                </div>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  Perlu perhatian lebih dalam subjek Tajwid
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Receipt Viewer Modal */}
      {showReceiptViewer && selectedReceipt && (
        <ReceiptViewer
          isOpen={showReceiptViewer}
          onClose={() => {
            setShowReceiptViewer(false);
            setSelectedReceipt(null);
          }}
          receiptNumber={selectedReceipt.receiptNumber}
          feeId={selectedReceipt.feeId}
          paymentId={selectedReceipt.paymentId}
        />
      )}
    </div>
  );
};

export default PelajarDetail;
