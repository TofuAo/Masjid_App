import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FileDropZone from '../../components/ui/FileDropZone';
import { Building2 } from 'lucide-react';
import { toast } from 'react-toastify';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Fasiliti - Image uploads for facilities.
 * Uses FileDropZone with 2MB max, images only.
 */
const Fasiliti = () => {
  const [formData, setFormData] = useState({ tajuk: '', butiran: '', tarikh: '', hari: '', masa: '', target_role: '' });
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);

  const handleFiles = (fileList) => {
    const list = Array.isArray(fileList) ? fileList : [fileList];
    const valid = list.filter((f) => f.size <= MAX_SIZE && f.type.startsWith('image/'));
    if (valid.length < list.length) {
      setUploadError('Hanya fail imej (JPG, PNG) sehingga 2MB dibenarkan.');
    } else {
      setUploadError(null);
    }
    setFiles(valid);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tajuk?.trim()) {
      toast.warning('Sila masukkan tajuk.');
      return;
    }
    toast.info('Fungsi simpan akan disambung ke backend.');
  };

  return (
    <PageLayout title="Fasiliti">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tajuk *</label>
            <input
              type="text"
              value={formData.tajuk}
              onChange={(e) => setFormData((p) => ({ ...p, tajuk: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Tajuk"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Butiran</label>
            <textarea
              value={formData.butiran}
              onChange={(e) => setFormData((p) => ({ ...p, butiran: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Butiran"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh</label>
              <input
                type="date"
                value={formData.tarikh}
                onChange={(e) => setFormData((p) => ({ ...p, tarikh: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
              <input
                type="text"
                value={formData.hari}
                onChange={(e) => setFormData((p) => ({ ...p, hari: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Isnin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Masa</label>
              <input
                type="text"
                value={formData.masa}
                onChange={(e) => setFormData((p) => ({ ...p, masa: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 09:00 - 10:00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <select
              value={formData.target_role || ''}
              onChange={(e) => setFormData((p) => ({ ...p, target_role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All</option>
              <option value="pelajar">Pelajar</option>
              <option value="guru">Guru</option>
              <option value="pilihan">Pilihan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Muat Naik Imej (maks 2MB)
            </label>
            <FileDropZone
              accept="image/*,.jpg,.jpeg,.png"
              maxSize={MAX_SIZE}
              onFiles={handleFiles}
              onError={(err) => setUploadError(err)}
              error={uploadError}
              hint="Seret fail imej ke sini atau klik untuk pilih. Maksimum 2MB."
            />
            {files.length > 0 && (
              <p className="mt-2 text-sm text-emerald-600">{files.length} fail dipilih.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary">Simpan</Button>
            <Button type="button" variant="secondary" onClick={() => setFormData({ tajuk: '', butiran: '', tarikh: '', hari: '', masa: '', target_role: '' })}>Batal</Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
};

export default Fasiliti;
