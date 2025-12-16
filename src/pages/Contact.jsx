import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, MapPin, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import ActivitiesBanner from '../components/contact/ActivitiesBanner';
import { settingsAPI } from '../services/api';

const Contact = ({ user }) => {
  const [contactInfo, setContactInfo] = useState({
    address_line1: 'Masjid Negeri Sultan Ahmad 1',
    address_line2: 'Kuantan, Pahang',
    phone: '+60 9-123 4567',
    email: 'admin@epengajian.com',
    hours_weekdays: 'Isnin - Jumaat: 8:00 AM - 5:00 PM',
    hours_weekend: 'Sabtu - Ahad: 9:00 AM - 1:00 PM'
  });

  useEffect(() => {
    // Fetch contact information from settings
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const keys = [
        'contact_address_line1',
        'contact_address_line2',
        'contact_phone',
        'contact_email',
        'contact_hours_weekdays',
        'contact_hours_weekend'
      ];
      
      const settingsPromises = keys.map(key => 
        settingsAPI.getByKey(key).catch(() => ({ data: { setting_value: '' } }))
      );
      
      const results = await Promise.all(settingsPromises);
      
      setContactInfo({
        address_line1: results[0]?.data?.setting_value || 'Masjid Negeri Sultan Ahmad 1',
        address_line2: results[1]?.data?.setting_value || 'Kuantan, Pahang',
        phone: results[2]?.data?.setting_value || '+60 9-123 4567',
        email: results[3]?.data?.setting_value || 'admin@epengajian.com',
        hours_weekdays: results[4]?.data?.setting_value || 'Isnin - Jumaat: 8:00 AM - 5:00 PM',
        hours_weekend: results[5]?.data?.setting_value || 'Sabtu - Ahad: 9:00 AM - 1:00 PM'
      });
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
      // Keep default values on error
    }
  };


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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
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
                  {contactInfo.address_line1}
                  {contactInfo.address_line2 && (
                    <>
                      <br />
                      {contactInfo.address_line2}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">Telefon</h3>
                <p className="text-sm text-gray-600">
                  <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-emerald-600">
                    {contactInfo.phone}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">Emel</h3>
                <p className="text-sm text-gray-600">
                  <a href={`mailto:${contactInfo.email}`} className="hover:text-emerald-600">
                    {contactInfo.email}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">Waktu Operasi</h3>
                <p className="text-sm text-gray-600">
                  {contactInfo.hours_weekdays}
                  {contactInfo.hours_weekend && (
                    <>
                      <br />
                      {contactInfo.hours_weekend}
                    </>
                  )}
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
              href={`https://wa.me/${contactInfo.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">WhatsApp Kami</span>
            </a>
            <a
              href={`mailto:${contactInfo.email}`}
              className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Hantar Emel</span>
            </a>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default Contact;

