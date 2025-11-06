import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Calendar, X } from 'lucide-react';

const AnnouncementForm = ({ announcement, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'published',
    priority: 'normal',
    target_audience: 'all',
    start_date: '',
    end_date: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (announcement) {
      const formatDateTime = (dateString) => {
        if (!dateString) return '';
        try {
          // Parse the date string - it might be in UTC or local time
          const date = new Date(dateString);
          
          // Get local time components (not UTC) to preserve the intended time
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          // Return in datetime-local format (YYYY-MM-DDTHH:mm)
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return '';
        }
      };

      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        status: announcement.status || 'published',
        priority: announcement.priority || 'normal',
        target_audience: announcement.target_audience || 'all',
        start_date: formatDateTime(announcement.start_date),
        end_date: formatDateTime(announcement.end_date)
      });
    }
  }, [announcement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Tajuk diperlukan';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Tajuk mesti sekurang-kurangnya 3 aksara';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Kandungan diperlukan';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Kandungan mesti sekurang-kurangnya 10 aksara';
    }
    
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        newErrors.end_date = 'Tarikh tamat mesti selepas tarikh mula';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title>{announcement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</Card.Title>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tajuk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan tajuk pengumuman"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kandungan <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={6}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan kandungan pengumuman"
            />
            {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keutamaan
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sasaran Pengguna
            </label>
            <select
              name="target_audience"
              value={formData.target_audience}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Pengguna</option>
              <option value="students">Pelajar Sahaja</option>
              <option value="teachers">Guru Sahaja</option>
              <option value="admin">Admin Sahaja</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tarikh Mula (Pilihan)
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tarikh Tamat (Pilihan)
              </label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Batal
            </Button>
            <Button type="submit">
              {announcement ? 'Kemaskini' : 'Buat Pengumuman'}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
};

export default AnnouncementForm;

