import React, { useEffect, useState } from 'react';
import Card from '../ui/Card';
import { classesAPI, teachersAPI } from '../../services/api';
import { BookOpen, Users, Clock, CreditCard } from 'lucide-react';
import LoadingSkeleton from '../ui/LoadingSkeleton';

const trimText = (value, limit = 120) => {
  if (!value) return '-';
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
};

const FeaturedClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await teachersAPI.getAll({ limit: 50 });
        setTeachers(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('FeaturedClasses: failed to load teachers', err);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await classesAPI.getAll({ status: 'aktif', limit: 5 });
        const data = Array.isArray(response) ? response : [];
        setClasses(data.slice(0, 5));
      } catch (err) {
        // Don't log canceled/duplicate request errors - they're expected
        if (!err.isCanceled && !err.isExpected) {
          setError(err?.message || 'Gagal memuatkan kelas.');
          console.error('FeaturedClasses error', err);
        }
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, []);

  const getTeacherName = (kelas) => {
    if (kelas.guru_nama) return kelas.guru_nama;
    if (kelas.guru) return kelas.guru.nama;
    const match = teachers.find((t) => t.telefon === kelas.guru_telefon || t.telefon === kelas.guru_id);
    return match?.nama || 'Masih dikenalpasti';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-sm text-red-600">
          {error}
        </div>
      );
    }

    if (classes.length === 0) {
      return (
        <p className="text-sm text-gray-600">
          Tiada kelas aktif setakat ini. Tambah dan aktifkan satu kelas terlebih dahulu.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {classes.map((kelas) => (
          <div key={kelas.id || kelas.kelas_id} className="border border-gray-200 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Kelas</p>
                <h3 className="text-lg font-semibold text-gray-900">{kelas.nama_kelas || kelas.class_name || 'Nama Kelas'}</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full">Starter</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{trimText(kelas.deskripsi || kelas.description, 140)}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                {kelas.jadual || kelas.schedule || 'Jadual akan datang'}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                {getTeacherName(kelas)}
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-600" />
                {kelas.yuran ? `RM ${Number(kelas.yuran).toFixed(2)}` : 'Yuran fleksibel'}
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-600" />
                Kapasiti {kelas.kapasiti || kelas.capacity || 'terhad'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Senarai Kelas Starter</Card.Title>
        <p className="text-sm text-gray-500">
          Hanya 2-5 kelas fokus untuk permulaan. Kemas kini katalog mengikut pertumbuhan.
        </p>
      </Card.Header>
      <Card.Content>
        {renderContent()}
      </Card.Content>
    </Card>
  );
};

export default FeaturedClasses;

