import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Send, MapPin, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ActivitiesBanner from '../components/contact/ActivitiesBanner';
import api from '../services/api';

const Contact = ({ user }) => {
  const [formData, setFormData] = useState({
    name: user?.nama || '',
    email: user?.email || '',
    phone: user?.telefon || '',
    subject: '',
    message: '',
    contact_method: 'email' // 'email', 'whatsapp', 'both'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Pre-fill user data if logged in
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.nama || '',
        email: user.email || '',
        phone: user.telefon || ''
      }));
    }
  }, [user]);

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

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Nama diperlukan';
    }

    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Emel diperlukan';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Format emel tidak sah';
      }
    }

    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = 'Nombor telefon diperlukan';
    } else {
      const phoneRegex = /^(\+?6?01)[0-46-9]-?[0-9]{7,8}$/;
      const cleanedPhone = formData.phone.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = 'Format nombor telefon tidak sah';
      }
    }

    if (!formData.subject || formData.subject.trim() === '') {
      newErrors.subject = 'Subjek diperlukan';
    }

    if (!formData.message || formData.message.trim() === '') {
      newErrors.message = 'Mesej diperlukan';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Mesej mestilah sekurang-kurangnya 10 aksara';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Sila lengkapkan semua medan yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/contact', formData);
      
      if (response.success) {
        setSubmitted(true);
        toast.success('Mesej anda telah dihantar! Kami akan menghubungi anda tidak lama lagi.');
        
        // Reset form
        setFormData({
          name: user?.nama || '',
          email: user?.email || '',
          phone: user?.telefon || '',
          subject: '',
          message: '',
          contact_method: 'email'
        });
        
        // Reset submitted state after 5 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        toast.error(response.message || 'Gagal menghantar mesej. Sila cuba lagi.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      const errorMsg = error.message || 'Gagal menghantar mesej. Sila cuba lagi.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Content>
            <div className="text-center py-8">
              <div className="mx-auto mb-4 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mesej Dihantar!</h2>
              <p className="text-gray-600 mb-6">
                Terima kasih kerana menghubungi kami. Kami akan membalas mesej anda secepat mungkin.
              </p>
              <Button
                onClick={() => setSubmitted(false)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Hantar Mesej Lain
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interactive Activities Banner */}
      <ActivitiesBanner />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hubungi Kami</h1>
        <p className="text-gray-600">
          Ada soalan atau cadangan? Kami di sini untuk membantu anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-black">Maklumat Perhubungan</h2>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Alamat</h3>
                  <p className="text-sm text-gray-600">
                    Masjid Negeri Sultan Ahmad 1<br />
                    Kuantan, Pahang
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Telefon</h3>
                  <p className="text-sm text-gray-600">
                    <a href="tel:+6091234567" className="hover:text-emerald-600">
                      +60 9-123 4567
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Emel</h3>
                  <p className="text-sm text-gray-600">
                    <a href="mailto:admin@epengajian.com" className="hover:text-emerald-600">
                      admin@epengajian.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Waktu Operasi</h3>
                  <p className="text-sm text-gray-600">
                    Isnin - Jumaat: 8:00 AM - 5:00 PM<br />
                    Sabtu - Ahad: 9:00 AM - 1:00 PM
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-black">Tindakan Pantas</h2>
            </Card.Header>
            <Card.Content className="space-y-2">
              <a
                href="https://wa.me/60123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">WhatsApp Kami</span>
              </a>
              <a
                href="mailto:admin@epengajian.com"
                className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Hantar Emel</span>
              </a>
            </Card.Content>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-black">Hantar Mesej</h2>
            </Card.Header>
            <Card.Content>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Penuh <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Masukkan nama penuh"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emel <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="nama@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombor Telefon <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="012-3456789"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjek <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Contoh: Soalan tentang kelas"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kaedah Perhubungan
                  </label>
                  <select
                    name="contact_method"
                    value={formData.contact_method}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="email">Emel Sahaja</option>
                    <option value="whatsapp">WhatsApp Sahaja</option>
                    <option value="both">Emel dan WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mesej <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Tulis mesej anda di sini..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setFormData({
                        name: user?.nama || '',
                        email: user?.email || '',
                        phone: user?.telefon || '',
                        subject: '',
                        message: '',
                        contact_method: 'email'
                      });
                      setErrors({});
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    Set Semula
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Menghantar...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Hantar Mesej</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;

