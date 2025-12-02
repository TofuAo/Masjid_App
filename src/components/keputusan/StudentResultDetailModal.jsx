import React, { useState, useEffect } from 'react';
import { X, FileText, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { resultsAPI } from '../../services/api';
import Badge from '../ui/Badge';
import LoadingSkeleton from '../ui/LoadingSkeleton';

const StudentResultDetailModal = ({ isOpen, onClose, studentIc, studentName, className }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && studentIc) {
      fetchStudentResults();
    }
  }, [isOpen, studentIc]);

  const fetchStudentResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const allResults = await resultsAPI.getAll({ limit: 1000 });
      const resultsArray = Array.isArray(allResults) ? allResults : (allResults.data || []);
      
      // Filter results for this student
      const studentResults = resultsArray.filter(r => 
        (r.student_ic === studentIc || r.pelajar_ic === studentIc)
      );
      
      // Separate into Menulis (Writing/Bertulis) and Menghafal (Memorizing/Lisan)
      const menulisResult = studentResults.find(r => {
        const subject = r.exam_subject || r.peperiksaan_nama || r.subject || '';
        return subject.includes('Menulis') || subject.includes('Writing');
      });
      
      const menghafalResult = studentResults.find(r => {
        const subject = r.exam_subject || r.peperiksaan_nama || r.subject || '';
        return subject.includes('Menghafal') || subject.includes('Memorizing');
      });
      
      setResults([
        { type: 'bertulis', label: 'Bertulis (Menulis)', result: menulisResult },
        { type: 'lisan', label: 'Lisan (Menghafal)', result: menghafalResult }
      ]);
    } catch (err) {
      console.error('Failed to fetch student results:', err);
      setError('Gagal memuatkan keputusan pelajar.');
    } finally {
      setLoading(false);
    }
  };

  const getGradeBadge = (gred) => {
    if (!gred) return null;
    const gradeConfig = {
      'A+': { variant: 'success', color: 'text-green-600' },
      'A': { variant: 'success', color: 'text-green-600' },
      'A-': { variant: 'success', color: 'text-green-600' },
      'B+': { variant: 'info', color: 'text-blue-600' },
      'B': { variant: 'info', color: 'text-blue-600' },
      'B-': { variant: 'info', color: 'text-blue-600' },
      'C+': { variant: 'warning', color: 'text-amber-600' },
      'C': { variant: 'warning', color: 'text-amber-600' },
      'C-': { variant: 'warning', color: 'text-amber-600' },
      'D': { variant: 'danger', color: 'text-red-600' },
      'F': { variant: 'danger', color: 'text-red-600' }
    };
    const config = gradeConfig[gred] || { variant: 'default', color: 'text-gray-600' };
    return (
      <Badge variant={config.variant} className={config.color}>
        {gred}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const statusConfig = {
      lulus: { variant: 'success', label: 'Lulus', icon: <TrendingUp className="w-4 h-4" /> },
      gagal: { variant: 'danger', label: 'Gagal', icon: <TrendingDown className="w-4 h-4" /> }
    };
    const config = statusConfig[status] || { variant: 'default', label: status, icon: null };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Keputusan Peperiksaan</h3>
            <p className="text-sm text-gray-600 mt-1">{studentName}</p>
            {className && <p className="text-sm text-gray-500">{className}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="space-y-4">
              <LoadingSkeleton type="card" />
              <LoadingSkeleton type="card" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <div className="space-y-4">
              {results.map(({ type, label, result }) => (
                <div
                  key={type}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        type === 'bertulis' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {type === 'bertulis' ? (
                          <FileText className={`w-6 h-6 ${type === 'bertulis' ? 'text-blue-600' : 'text-purple-600'}`} />
                        ) : (
                          <Award className={`w-6 h-6 ${type === 'bertulis' ? 'text-blue-600' : 'text-purple-600'}`} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{label}</h4>
                        {result?.exam_date && (
                          <p className="text-sm text-gray-500">
                            Tarikh: {new Date(result.exam_date).toLocaleDateString('ms-MY')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {result ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Markah</p>
                        <p className="text-2xl font-bold text-gray-900">{result.markah || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Gred</p>
                        <div className="mt-1">
                          {getGradeBadge(result.gred)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <div className="mt-1">
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Catatan</p>
                        <p className="text-sm text-gray-900">{result.catatan || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <p>Tiada keputusan untuk {label.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Summary */}
              {results.some(r => r.result) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Ringkasan</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Purata Markah</p>
                      <p className="text-lg font-bold text-gray-900">
                        {(() => {
                          const validResults = results.filter(r => r.result && r.result.markah);
                          if (validResults.length === 0) return '-';
                          const sum = validResults.reduce((acc, r) => acc + (Number(r.result.markah) || 0), 0);
                          return (sum / validResults.length).toFixed(1);
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Jumlah Keputusan</p>
                      <p className="text-lg font-bold text-gray-900">
                        {results.filter(r => r.result).length} / 2
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentResultDetailModal;

