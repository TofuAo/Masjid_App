import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageCircle, 
  FileText, 
  Search,
  ChevronRight,
  User,
  GraduationCap,
  Shield,
  CheckCircle,
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getEffectiveRole } from '../utils/userRoles';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user ? getEffectiveRole(user) : 'guest';

  const categories = [
    {
      id: 'getting-started',
      title: 'Memulakan',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-blue-500',
      articles: [
        {
          id: 'first-login',
          title: 'Cara Log Masuk Kali Pertama',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Langkah-langkah Log Masuk:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Buka pelayar web (Chrome, Firefox, atau Edge)</li>
              <li class="font-medium">Masukkan alamat URL sistem</li>
              <li class="font-medium">Masukkan Nombor IC anda</li>
              <li class="font-medium">Masukkan kata laluan anda</li>
              <li class="font-medium">Klik butang "Log Masuk"</li>
              <li class="font-medium">Jika anda mempunyai banyak peranan, pilih peranan yang ingin digunakan</li>
            </ol>
            <p class="text-sm text-gray-900 font-medium">Nota: Jika anda lupa kata laluan, klik "Lupa Kata Laluan?" untuk reset.</p>
          `
        },
        {
          id: 'dashboard-overview',
          title: 'Memahami Dashboard',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Komponen Dashboard:</h3>
            <ul class="list-disc list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium"><strong class="text-gray-900">Statistik:</strong> Nombor penting tentang sistem atau akaun anda</li>
              <li class="font-medium"><strong class="text-gray-900">Pengumuman:</strong> Notis penting dari pentadbir</li>
              <li class="font-medium"><strong class="text-gray-900">Aktiviti Terkini:</strong> Sejarah tindakan terkini</li>
              <li class="font-medium"><strong class="text-gray-900">Pautan Pantas:</strong> Akses cepat ke fungsi utama</li>
            </ul>
            <p class="text-sm text-gray-900 font-medium">Dashboard adalah halaman utama yang memberikan gambaran keseluruhan sistem.</p>
          `
        },
        {
          id: 'profile-setup',
          title: 'Menyediakan Profil',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Langkah-langkah:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke "Akaun Saya" atau "Tetapan"</li>
              <li class="font-medium">Isi semua maklumat yang diperlukan</li>
              <li class="font-medium">Pastikan nombor telefon dan email adalah betul</li>
              <li class="font-medium">Klik "Simpan" untuk menyimpan perubahan</li>
            </ol>
          `
        }
      ]
    },
    {
      id: 'student-guide',
      title: 'Panduan Pelajar',
      icon: <User className="w-6 h-6" />,
      color: 'bg-green-500',
      articles: [
        {
          id: 'view-attendance',
          title: 'Cara Lihat Kehadiran',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Melihat Rekod Kehadiran:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke menu "Kehadiran"</li>
              <li class="font-medium">Anda akan melihat rekod kehadiran bulan semasa</li>
              <li class="font-medium">Gunakan penapis tarikh untuk melihat bulan lain</li>
              <li class="font-medium">Status kehadiran: Hadir (✓), Tidak Hadir (✗), Lewat (⏰), Cuti (🏖️)</li>
            </ol>
          `
        },
        {
          id: 'view-results',
          title: 'Cara Lihat Keputusan',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Melihat Keputusan Peperiksaan:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke menu "Keputusan"</li>
              <li class="font-medium">Pilih peperiksaan yang ingin dilihat</li>
              <li class="font-medium">Lihat markah dan gred anda</li>
              <li class="font-medium">Klik "Muat Turun" untuk menyimpan slip keputusan</li>
            </ol>
          `
        },
        {
          id: 'pay-fees',
          title: 'Cara Bayar Yuran',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Membayar Yuran:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke menu "Yuran"</li>
              <li class="font-medium">Lihat senarai yuran bulanan</li>
              <li class="font-medium">Pilih yuran yang ingin dibayar</li>
              <li class="font-medium">Klik "Bayar Sekarang"</li>
              <li class="font-medium">Pilih kaedah pembayaran</li>
              <li class="font-medium">Selesaikan pembayaran</li>
              <li class="font-medium">Muat naik bukti pembayaran jika diperlukan</li>
            </ol>
          `
        }
      ]
    },
    {
      id: 'teacher-guide',
      title: 'Panduan Guru',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'bg-purple-500',
      articles: [
        {
          id: 'mark-attendance',
          title: 'Cara Tandakan Kehadiran',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Menandakan Kehadiran Pelajar:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke menu "Kehadiran"</li>
              <li class="font-medium">Pilih kelas dan tarikh</li>
              <li class="font-medium">Untuk setiap pelajar, pilih status: Hadir, Tidak Hadir, Lewat, atau Cuti</li>
              <li class="font-medium">Muat naik gambar bukti kehadiran (pilihan)</li>
              <li class="font-medium">Klik "Simpan"</li>
            </ol>
          `
        },
        {
          id: 'enter-results',
          title: 'Cara Masukkan Keputusan',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Memasukkan Keputusan Peperiksaan:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke menu "Keputusan"</li>
              <li class="font-medium">Pilih peperiksaan yang berkaitan</li>
              <li class="font-medium">Klik "Tambah Keputusan" atau "Kemas Kini"</li>
              <li class="font-medium">Masukkan markah untuk setiap pelajar</li>
              <li class="font-medium">Muat naik slip keputusan (pilihan)</li>
              <li class="font-medium">Klik "Simpan"</li>
            </ol>
          `
        },
        {
          id: 'view-students',
          title: 'Cara Lihat Pelajar Kelas',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Melihat Senarai Pelajar:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke menu "Pelajar"</li>
              <li class="font-medium">Gunakan penapis untuk melihat pelajar kelas anda</li>
              <li class="font-medium">Klik pada nama pelajar untuk melihat profil lengkap</li>
              <li class="font-medium">Lihat rekod kehadiran dan yuran pelajar</li>
            </ol>
          `
        }
      ]
    },
    {
      id: 'admin-guide',
      title: 'Panduan Pentadbir',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-red-500',
      articles: [
        {
          id: 'add-student',
          title: 'Cara Tambah Pelajar',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Menambah Pelajar Baru:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke menu "Pelajar"</li>
              <li class="font-medium">Klik butang "Tambah Pelajar"</li>
              <li class="font-medium">Isi semua maklumat yang diperlukan</li>
              <li class="font-medium">Pilih kelas untuk pelajar</li>
              <li class="font-medium">Klik "Simpan"</li>
            </ol>
            <p class="text-sm text-gray-900 font-medium mt-4">Nota: Anda juga boleh import pelajar dari fail CSV.</p>
          `
        },
        {
          id: 'create-class',
          title: 'Cara Cipta Kelas',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Mencipta Kelas Baru:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Pergi ke menu "Kelas"</li>
              <li class="font-medium">Klik butang "Tambah Kelas"</li>
              <li class="font-medium">Isi nama kelas, level, dan sesi</li>
              <li class="font-medium">Tetapkan yuran kelas</li>
              <li class="font-medium">Pilih guru untuk kelas</li>
              <li class="font-medium">Klik "Simpan"</li>
            </ol>
          `
        },
        {
          id: 'manage-users',
          title: 'Cara Kelola Pengguna',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Mengurus Pengguna:</h3>
            <ul class="list-disc list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium"><strong class="text-gray-900">Kelulusan Pendaftaran:</strong> Pergi ke "Kelulusan Pendaftaran" untuk meluluskan pendaftaran baharu</li>
              <li class="font-medium"><strong class="text-gray-900">Tetapkan Peranan:</strong> Tetapkan peranan pengguna di halaman "Pengurusan Admin"</li>
              <li class="font-medium"><strong class="text-gray-900">Reset Kata Laluan:</strong> Reset kata laluan pengguna jika diperlukan</li>
            </ul>
          `
        }
      ]
    },
    {
      id: 'faq',
      title: 'Soalan Lazim',
      icon: <HelpCircle className="w-6 h-6" />,
      color: 'bg-yellow-500',
      articles: [
        {
          id: 'forgot-password',
          title: 'Lupa Kata Laluan?',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Cara Reset Kata Laluan:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Klik "Lupa Kata Laluan?" di halaman log masuk</li>
              <li class="font-medium">Pilih kaedah reset (Email atau SMS)</li>
              <li class="font-medium">Masukkan nombor IC anda</li>
              <li class="font-medium">Terima kod reset</li>
              <li class="font-medium">Masukkan kod reset</li>
              <li class="font-medium">Tetapkan kata laluan baru</li>
            </ol>
          `
        },
        {
          id: 'change-password',
          title: 'Cara Tukar Kata Laluan',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Menukar Kata Laluan:</h3>
            <ol class="list-decimal list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium">Log masuk ke sistem</li>
              <li class="font-medium">Pergi ke "Akaun Saya" atau "Tetapan"</li>
              <li class="font-medium">Klik "Tukar Kata Laluan"</li>
              <li class="font-medium">Masukkan kata laluan lama</li>
              <li class="font-medium">Masukkan kata laluan baru</li>
              <li class="font-medium">Klik "Simpan"</li>
            </ol>
          `
        },
        {
          id: 'upload-files',
          title: 'Format Fail yang Disokong',
          content: `
            <h3 class="text-lg font-semibold mb-3 text-gray-900">Jenis Fail yang Boleh Dimuat Naik:</h3>
            <ul class="list-disc list-inside space-y-2 mb-4 text-gray-900">
              <li class="font-medium"><strong class="text-gray-900">Gambar:</strong> JPG, PNG (Maksimum 5MB)</li>
              <li class="font-medium"><strong class="text-gray-900">Dokumen:</strong> PDF (Maksimum 10MB)</li>
            </ul>
            <p class="text-sm text-gray-900 font-medium">Nota: Pastikan fail tidak terlalu besar dan dalam format yang betul.</p>
          `
        }
      ]
    }
  ];

  const filteredCategories = categories.filter(cat => {
    if (selectedCategory && cat.id !== selectedCategory) return false;
    if (searchQuery) {
      const matchesCategory = cat.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArticles = cat.articles.some(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesCategory || matchesArticles;
    }
    return true;
  });

  const getRoleSpecificCategories = () => {
    if (userRole === 'student') {
      return categories.filter(cat => 
        cat.id === 'student-guide' || cat.id === 'getting-started' || cat.id === 'faq'
      );
    } else if (userRole === 'teacher') {
      return categories.filter(cat => 
        cat.id === 'teacher-guide' || cat.id === 'getting-started' || cat.id === 'faq'
      );
    } else if (userRole === 'admin') {
      return categories;
    }
    return categories;
  };

  const displayCategories = selectedCategory 
    ? categories.filter(cat => cat.id === selectedCategory)
    : (searchQuery ? filteredCategories : getRoleSpecificCategories());

  const selectedCategoryData = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory)
    : null;

  const selectedArticleData = selectedArticle 
    ? categories.flatMap(cat => cat.articles).find(art => art.id === selectedArticle)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-3 rounded-full">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pusat Bantuan</h1>
                <p className="text-gray-700">Cari jawapan untuk soalan anda</p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center space-x-2 text-blue-700 hover:text-blue-900 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari bantuan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Breadcrumb */}
        {(selectedCategory || selectedArticle) && (
          <div className="flex items-center space-x-2 text-sm text-gray-700 mb-4">
            <button
              onClick={() => {
                setSelectedArticle(null);
                setSelectedCategory(null);
              }}
              className="hover:text-blue-700 font-medium"
            >
              Bantuan
            </button>
            {selectedCategory && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span>{selectedCategoryData?.title}</span>
              </>
            )}
            {selectedArticle && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span>{selectedArticleData?.title}</span>
              </>
            )}
          </div>
        )}

        {/* Content */}
        {selectedArticle ? (
          /* Article View */
          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center space-x-2 text-blue-700 hover:text-blue-900 mb-4 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali</span>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{selectedArticleData?.title}</h2>
            <div
              className="prose max-w-none prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900 prose-strong:text-gray-900 prose-ol:text-gray-900 prose-ul:text-gray-900"
              dangerouslySetInnerHTML={{ __html: selectedArticleData?.content }}
            />
          </div>
        ) : selectedCategory ? (
          /* Category Articles */
          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center space-x-2 text-blue-700 hover:text-blue-900 mb-4 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali</span>
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`${selectedCategoryData?.color} p-3 rounded-lg text-white`}>
                {selectedCategoryData?.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCategoryData?.title}</h2>
            </div>
            <div className="space-y-4">
              {selectedCategoryData?.articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article.id)}
                  className="border-2 border-gray-300 rounded-lg p-4 hover:border-blue-600 hover:shadow-md cursor-pointer transition-all bg-white"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Categories Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg cursor-pointer transition-all border border-gray-200"
              >
                <div className={`${category.color} p-4 rounded-lg inline-block mb-4 text-white`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{category.title}</h3>
                <p className="text-gray-700 mb-4 font-medium">{category.articles.length} artikel</p>
                <div className="flex items-center text-blue-700 font-semibold">
                  <span>Lihat artikel</span>
                  <ChevronRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Support */}
        {!selectedArticle && !selectedCategory && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Masih Perlu Bantuan?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/contact"
                className="flex items-center space-x-3 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all bg-white"
              >
                <MessageCircle className="w-6 h-6 text-blue-700" />
                <div>
                  <h4 className="font-semibold text-gray-900">Hubungi Kami</h4>
                  <p className="text-sm text-gray-700">Hantar mesej kepada kami</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpCenter;

