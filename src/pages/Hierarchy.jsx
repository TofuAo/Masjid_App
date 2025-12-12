import React from 'react';
import Card from '../components/ui/Card';
import { 
  Crown, 
  Shield, 
  UserCog, 
  Users, 
  GraduationCap,
  ArrowDown,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

const Hierarchy = ({ user }) => {
  const hierarchy = [
    {
      level: 1,
      role: 'ib',
      label: 'IB (Pengesah Pembayaran)',
      icon: <Crown className="w-8 h-8" />,
      color: 'from-purple-600 to-purple-800',
      description: 'Peringkat tertinggi dalam sistem. Mempunyai akses penuh untuk mengesahkan pembayaran dan mengawal sistem.',
      permissions: [
        'Mengesahkan semua pembayaran',
        'Akses penuh ke semua modul',
        'Mengawal tetapan sistem',
        'Melihat semua laporan',
        'Menguruskan pengguna'
      ],
      access: [
        'Dashboard',
        'Pengesahan Pembayaran',
        'Laporan Kewangan',
        'Tetapan Sistem',
        'Semua modul admin'
      ]
    },
    {
      level: 2,
      role: 'admin',
      label: 'Admin Sistem (Pentadbir)',
      icon: <Shield className="w-8 h-8" />,
      color: 'from-blue-600 to-blue-800',
      description: 'Pentadbir sistem dengan akses penuh untuk menguruskan semua aspek sistem masjid.',
      permissions: [
        'Menguruskan pengguna (Admin, PIC, Staff, Guru, Pelajar)',
        'Menguruskan kelas dan jadual',
        'Menguruskan yuran dan pembayaran',
        'Menguruskan keputusan peperiksaan',
        'Melihat dan menguruskan laporan',
        'Menguruskan pengumuman',
        'Menguruskan tetapan sistem',
        'Mengesahkan pendaftaran pengguna baru'
      ],
      access: [
        'Dashboard',
        'Pengurusan Pengguna',
        'Pengurusan Kelas',
        'Kehadiran',
        'Yuran',
        'Keputusan',
        'Laporan',
        'Tetapan',
        'Check In/Out',
        'Pengumuman'
      ]
    },
    {
      level: 3,
      role: 'pic',
      label: 'PIC Masjid',
      icon: <UserCog className="w-8 h-8" />,
      color: 'from-emerald-600 to-emerald-800',
      description: 'Person In Charge yang bertanggungjawab menguruskan operasi harian masjid.',
      permissions: [
        'Menguruskan pelajar dan guru',
        'Menguruskan kelas',
        'Merekodkan kehadiran',
        'Menguruskan yuran',
        'Menguruskan keputusan',
        'Melihat laporan',
        'Menguruskan pengumuman',
        'Check In/Out'
      ],
      access: [
        'Dashboard',
        'Pelajar',
        'Guru',
        'Kelas',
        'Kehadiran',
        'Yuran',
        'Keputusan',
        'Laporan',
        'Check In/Out',
        'Pengumuman'
      ]
    },
    {
      level: 4,
      role: 'staff',
      label: 'Staff / Guru',
      icon: <Users className="w-8 h-8" />,
      color: 'from-orange-600 to-orange-800',
      description: 'Kakitangan dan guru yang membantu dalam operasi harian masjid dan pengajaran.',
      permissions: [
        'Melihat senarai pelajar',
        'Merekodkan kehadiran pelajar',
        'Menguruskan kelas yang diamanahkan',
        'Menguruskan keputusan peperiksaan',
        'Melihat pengumuman',
        'Check In/Out'
      ],
      access: [
        'Dashboard',
        'Pelajar (baca sahaja)',
        'Kelas (yang diamanahkan)',
        'Kehadiran',
        'Keputusan',
        'Check In/Out',
        'Pengumuman'
      ]
    },
    {
      level: 5,
      role: 'teacher',
      label: 'Guru',
      icon: <GraduationCap className="w-8 h-8" />,
      color: 'from-teal-600 to-teal-800',
      description: 'Guru yang mengajar kelas-kelas pengajian di masjid.',
      permissions: [
        'Melihat senarai pelajar dalam kelas',
        'Merekodkan kehadiran pelajar',
        'Menguruskan keputusan peperiksaan',
        'Melihat pengumuman',
        'Check In/Out'
      ],
      access: [
        'Dashboard',
        'Pelajar (kelas sendiri)',
        'Kelas (yang diamanahkan)',
        'Kehadiran',
        'Keputusan',
        'Check In/Out',
        'Pengumuman'
      ]
    },
    {
      level: 6,
      role: 'student',
      label: 'Pelajar',
      icon: <Users className="w-8 h-8" />,
      color: 'from-gray-600 to-gray-800',
      description: 'Pelajar yang mendaftar untuk kelas pengajian di masjid.',
      permissions: [
        'Melihat maklumat sendiri',
        'Melihat kehadiran sendiri',
        'Melihat keputusan peperiksaan sendiri',
        'Melihat yuran sendiri',
        'Melihat pengumuman',
        'Membayar yuran'
      ],
      access: [
        'Dashboard',
        'Kehadiran (sendiri)',
        'Keputusan (sendiri)',
        'Yuran (sendiri)',
        'Pengumuman'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Hierarki Sistem</h1>
        <p className="text-sm text-gray-500">
          Gambaran keseluruhan struktur peranan dan tahap akses dalam sistem e-Quran Masjid Negeri Sultan Ahmad 1
        </p>
      </div>

      <Card>
        <Card.Content>
          <div className="space-y-8">
            {hierarchy.map((item, index) => (
              <div key={item.role}>
                {/* Role Card */}
                <div className={`relative bg-gradient-to-r ${item.color} rounded-lg p-6 text-white shadow-lg`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">
                            Tahap {item.level}
                          </span>
                          <h2 className="text-xl font-bold">{item.label}</h2>
                        </div>
                        <p className="text-white/90 text-sm mb-4">{item.description}</p>
                        
                        {/* Permissions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Kebenaran
                            </h3>
                            <ul className="space-y-1 text-xs">
                              {item.permissions.map((permission, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-white/80 mt-1">•</span>
                                  <span className="text-white/90">{permission}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              Akses Modul
                            </h3>
                            <ul className="space-y-1 text-xs">
                              {item.access.map((module, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-white/80 mt-1">•</span>
                                  <span className="text-white/90">{module}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow between levels */}
                {index < hierarchy.length - 1 && (
                  <div className="flex justify-center my-4">
                    <div className="flex flex-col items-center">
                      <ArrowDown className="w-6 h-6 text-gray-600" />
                      <div className="h-8 w-0.5 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Summary Card */}
      <Card>
        <Card.Header>
          <Card.Title>Ringkasan Hierarki</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Struktur Kuasa</h3>
              <p className="text-sm text-blue-700">
                Setiap peranan mempunyai tahap kuasa yang berbeza, dengan IB sebagai peringkat tertinggi 
                dan Pelajar sebagai pengguna asas. Peranan yang lebih tinggi mempunyai akses kepada semua 
                fungsi peranan di bawahnya.
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="font-semibold text-emerald-900 mb-2">Prinsip Akses</h3>
              <p className="text-sm text-emerald-700">
                Akses diberikan berdasarkan prinsip "need-to-know" di mana setiap peranan hanya mempunyai 
                akses kepada maklumat dan fungsi yang diperlukan untuk melaksanakan tugas mereka dengan 
                berkesan.
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Hierarchy;

