import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Upload, FileText, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { authAPI } from '../services/api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const PendingTeacherDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const documentTypes = [
    { id: 'sijil', label: 'Sijil Kelayakan', required: true },
    { id: 'resume', label: 'Resume / CV', required: true },
    { id: 'ic', label: 'Salinan Kad Pengenalan / Bil', required: true },
    { id: 'sijil_akademik', label: 'Sijil Akademik', required: false },
    { id: 'sijil_pengalaman', label: 'Sijil Pengalaman Mengajar', required: false },
    { id: 'lain', label: 'Dokumen Lain', required: false }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // TODO: Implement API endpoint to fetch teacher documents
      // const response = await authAPI.getTeacherDocuments();
      // if (response.success) {
      //   setDocuments(response.data || []);
      // }
      setDocuments([]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Gagal memuatkan dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type, file) => {
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Saiz fail terlalu besar. Maksimum 5MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format fail tidak disokong. Sila gunakan JPG, PNG, atau PDF.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', type);
      formData.append('file', file);

      // TODO: Implement API endpoint to upload teacher documents
      // const response = await authAPI.uploadTeacherDocument(formData);
      // if (response.success) {
      //   toast.success('Dokumen berjaya dimuat naik');
      //   fetchDocuments();
      // } else {
      //   toast.error(response.message || 'Gagal memuat naik dokumen');
      // }
      
      // Temporary success message
      toast.success('Dokumen berjaya dimuat naik (simulasi)');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Gagal memuat naik dokumen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Adakah anda pasti ingin memadam dokumen ini?')) {
      return;
    }

    try {
      // TODO: Implement API endpoint to delete teacher documents
      // const response = await authAPI.deleteTeacherDocument(docId);
      // if (response.success) {
      //   toast.success('Dokumen berjaya dipadam');
      //   fetchDocuments();
      // }
      toast.success('Dokumen berjaya dipadam (simulasi)');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Gagal memadam dokumen');
    }
  };

  const getDocumentStatus = (type) => {
    const doc = documents.find(d => d.document_type === type);
    if (doc) {
      return { uploaded: true, url: doc.file_url, id: doc.id };
    }
    return { uploaded: false };
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Muat Naik Dokumen
        </h1>
        <p className="text-gray-600">
          Sila muat naik dokumen yang diperlukan untuk kelulusan akaun guru anda.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Nota Penting
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Format yang diterima: JPG, PNG, PDF</li>
              <li>Saiz maksimum: 5MB setiap fail</li>
              <li>Dokumen yang ditanda dengan * adalah wajib</li>
              <li>Pastikan dokumen jelas dan boleh dibaca</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentTypes.map((docType) => {
          const status = getDocumentStatus(docType.id);
          return (
            <Card key={docType.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">
                      {docType.label}
                    </h3>
                    {docType.required && (
                      <Badge variant="danger" className="text-xs">
                        Wajib
                      </Badge>
                    )}
                  </div>
                  {status.uploaded && (
                    <Badge variant="success" className="flex items-center space-x-1 w-fit">
                      <CheckCircle className="w-4 h-4" />
                      <span>Dilampirkan</span>
                    </Badge>
                  )}
                </div>
              </div>

              {status.uploaded ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Dokumen dilampirkan</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status.url && (
                        <a
                          href={status.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-600 hover:text-blue-700"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(status.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <label className="block">
                    <span className="sr-only">Tukar dokumen</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleFileUpload(docType.id, file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      disabled={uploading}
                    />
                  </label>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Klik untuk memilih fail
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, atau PDF (maks 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleFileUpload(docType.id, file);
                    }}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-emerald-50 border-emerald-200">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-emerald-900 mb-1">
              Selepas Memuat Naik
            </h3>
            <p className="text-sm text-emerald-800">
              Selepas anda memuat naik semua dokumen wajib, pentadbir akan menyemak permohonan anda. 
              Anda akan dimaklumkan melalui emel atau sistem apabila kelulusan diberikan.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PendingTeacherDocuments;
