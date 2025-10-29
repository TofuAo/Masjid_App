import React, { useState, useEffect, useCallback } from 'react';
import useCrud from '../hooks/useCrud';
import { studentsAPI, teachersAPI, classesAPI, feesAPI, attendanceAPI, resultsAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { BarChart3, Download, FileText, Users, GraduationCap, BookOpen, CreditCard, Calendar, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const Laporan = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01', // Default to start of year
    end: new Date().toISOString().split('T')[0] // Default to current date
  });
  const [format, setFormat] = useState('csv'); // xlsx | csv | json (csv works without deps)

  const { items: students, loading: loadingStudents, error: errorStudents, fetchItems: fetchStudents } = useCrud(studentsAPI, 'pelajar');
  const { items: teachers, loading: loadingTeachers, error: errorTeachers, fetchItems: fetchTeachers } = useCrud(teachersAPI, 'guru');
  const { items: classes, loading: loadingClasses, error: errorClasses, fetchItems: fetchClasses } = useCrud(classesAPI, 'kelas');
  const { items: fees, loading: loadingFees, error: errorFees, fetchItems: fetchFees } = useCrud(feesAPI, 'yuran');
  const { items: attendance, loading: loadingAttendance, error: errorAttendance, fetchItems: fetchAttendance } = useCrud(attendanceAPI, 'kehadiran');
  const { items: results, loading: loadingResults, error: errorResults, fetchItems: fetchResults } = useCrud(resultsAPI, 'keputusan');

  const loading = loadingStudents || loadingTeachers || loadingClasses || loadingFees || loadingAttendance || loadingResults;
  const error = errorStudents || errorTeachers || errorClasses || errorFees || errorAttendance || errorResults;

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchClasses();
    fetchFees();
    fetchAttendance();
    fetchResults();
  }, [fetchStudents, fetchTeachers, fetchClasses, fetchFees, fetchAttendance, fetchResults]);

  const getReportData = () => {
    const studentsArray = Array.isArray(students) ? students : [];
    const teachersArray = Array.isArray(teachers) ? teachers : [];
    const classesArray = Array.isArray(classes) ? classes : [];
    const feesArray = Array.isArray(fees) ? fees : [];
    const attendanceArray = Array.isArray(attendance) ? attendance : [];
    const resultsArray = Array.isArray(results) ? results : [];

    const totalPelajars = studentsArray.length;
    const aktifPelajars = studentsArray.filter(s => s.status === 'aktif').length;
    const totalGurus = teachersArray.length;
    const totalKelass = classesArray.length;
    const totalYuranCollected = feesArray.filter(f => f.status === 'terbayar').reduce((sum, f) => sum + f.jumlah, 0);
    const totalAttendanceRecords = attendanceArray.length;
    const presentAttendance = attendanceArray.filter(a => a.status === 'hadir' || a.status === 'lewat').length;
    const attendanceRate = totalAttendanceRecords > 0 ? (presentAttendance / totalAttendanceRecords * 100).toFixed(1) : 0;
    const totalResults = resultsArray.length;
    const passedResults = resultsArray.filter(r => r.status === 'lulus').length;
    const passRate = totalResults > 0 ? (passedResults / totalResults * 100).toFixed(1) : 0;

    return {
      overview: {
        totalPelajars,
        totalGurus,
        totalKelass,
        totalYuran: totalYuranCollected,
        kehadiranRate: attendanceRate,
        lulusRate: passRate,
      },
      pelajars: {
        aktif: aktifPelajars,
        newThisMonth: studentsArray.filter(s => new Date(s.tarikh_daftar).getMonth() === new Date().getMonth() && new Date(s.tarikh_daftar).getFullYear() === new Date().getFullYear()).length,
        byKelas: classesArray.map(c => ({
          kelas: c.class_name,
          count: studentsArray.filter(s => s.kelas_id === c.id).length,
        })),
      },
      yuran: {
        totalKutipan: totalYuranCollected,
        totalTunggak: feesArray.filter(f => f.status === 'tunggak').reduce((sum, f) => sum + f.jumlah, 0),
        terbayar: feesArray.filter(f => f.status === 'terbayar').length,
        tunggak: feesArray.filter(f => f.status === 'tunggak').length,
        byMonth: [], // This would require more complex aggregation on the backend or frontend
      },
      kehadiran: {
        averageRate: attendanceRate,
        byKelas: classesArray.map(c => {
          const classAttendance = attendanceArray.filter(a => a.kelas_id === c.id);
          const classPresent = classAttendance.filter(a => a.status === 'hadir' || a.status === 'lewat').length;
          const rate = classAttendance.length > 0 ? (classPresent / classAttendance.length * 100).toFixed(1) : 0;
          return { kelas: c.class_name, rate };
        }),
        trends: [], // This would require more complex aggregation on the backend or frontend
      },
      keputusan: {
        averageMarkah: totalResults > 0 ? (resultsArray.reduce((sum, r) => sum + r.markah, 0) / totalResults).toFixed(1) : 0,
        lulus: passedResults,
        gagal: totalResults - passedResults,
        topPerformer: resultsArray.reduce((top, k) => k.markah > (top?.markah || 0) ? k : top, null),
      }
    };
  };

  const reportData = getReportData();

  const buildRows = () => {
    // Flatten report data into rows based on selected report
    switch (selectedReport) {
      case 'pelajars': {
        const arr = Array.isArray(students) ? students : [];
        return arr.map(s => ({
          IC: s.ic,
          Nama: s.nama,
          Telefon: s.telefon,
          Status: s.status,
          Kelas: s.kelas_nama || s.nama_kelas || '',
          Tarikh_Daftar: s.tarikh_daftar || ''
        }));
      }
      case 'yuran': {
        const arr = Array.isArray(fees) ? fees : [];
        return arr.map(f => ({
          Pelajar: f.pelajar_nama || f.nama,
          Bulan: f.bulan || '',
          Tahun: f.tahun || '',
          Jumlah: f.jumlah,
          Status: f.status,
          Tarikh_Bayar: f.tarikh_bayar || ''
        }));
      }
      case 'kehadiran': {
        const arr = Array.isArray(attendance) ? attendance : [];
        return arr.map(a => ({
          Pelajar: a.pelajar_nama || a.nama,
          Kelas: a.kelas_nama || a.nama_kelas || '',
          Tarikh: a.tarikh || '',
          Status: a.status
        }));
      }
      case 'overview':
      default: {
        const r = reportData.overview || {};
        return [
          { Metrik: 'Jumlah Pelajar', Nilai: r.totalPelajars || 0 },
          { Metrik: 'Jumlah Guru', Nilai: r.totalGurus || 0 },
          { Metrik: 'Jumlah Kelas', Nilai: r.totalKelass || 0 },
          { Metrik: 'Kutipan Terkini', Nilai: r.feesCollected || 0 },
        ];
      }
    }
  };

  const generateReport = async () => {
    try {
      const rows = buildRows();
      if (!rows || rows.length === 0) {
        toast.error('Tiada data untuk dijana.');
        return;
      }
      const filenameBase = `laporan_${selectedReport}_${dateRange.start}_${dateRange.end}`;

      if (format === 'xlsx') {
        try {
          const XLSX = await import('xlsx');
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
          XLSX.writeFile(wb, `${filenameBase}.xlsx`);
          return;
        } catch (e) {
          console.warn('xlsx not available, falling back to CSV:', e);
          // fall through to CSV
        }
      }

      if (format === 'csv') {
        const header = Object.keys(rows[0]);
        const csv = [header.join(',')].concat(rows.map(r => header.map(h => `${String(r[h] ?? '').replace(/"/g, '""')}`).join(','))).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenameBase}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // Default fallback: JSON
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameBase}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Generate report error:', err);
      toast.error('Gagal menjana laporan.');
    }
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-600" />
              Statistik Pelajar
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jumlah Pelajar</span>
                <span className="text-sm font-medium text-gray-900">{reportData.overview.totalPelajars || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pelajar Aktif</span>
                <span className="text-sm font-medium text-gray-900">{reportData.pelajars.aktif || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pelajar Baru (Bulan Ini)</span>
                <span className="text-sm font-medium text-gray-900">{reportData.pelajars.newThisMonth || 0}</span>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
              Statistik Guru
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jumlah Guru</span>
                <span className="text-sm font-medium text-gray-900">{reportData.overview.totalGurus || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Guru Aktif</span>
                <span className="text-sm font-medium text-gray-900">{reportData.overview.totalGurus || 0}</span> {/* Assuming all are active for now */}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Guru Cuti</span>
                <span className="text-sm font-medium text-gray-900">0</span> {/* No specific API for this yet */}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
              Statistik Kelas
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jumlah Kelas</span>
                <span className="text-sm font-medium text-gray-900">{reportData.overview.totalKelass || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kelas Aktif</span>
                <span className="text-sm font-medium text-gray-900">{reportData.overview.totalKelass || 0}</span> {/* Assuming all are active for now */}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kelas Penuh</span>
                <span className="text-sm font-medium text-gray-900">0</span> {/* No specific API for this yet */}
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              Kehadiran Purata
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                {reportData.overview.kehadiranRate || 0}%
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                {/* Placeholder for trend */}
                N/A dari bulan lepas
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              Kutipan Yuran
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                RM {(reportData.overview.totalYuran || 0).toLocaleString()}
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                {/* Placeholder for trend */}
                N/A dari bulan lepas
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );

  const renderPelajarsReport = () => (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <Card.Title>Taburan Pelajar Mengikut Kelas</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {(reportData.pelajars.byKelas || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.kelas}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full" 
                      style={{ width: `${(item.count / (reportData.overview.totalPelajars || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{reportData.pelajars.aktif || 0}</div>
            <div className="text-sm text-gray-600">Pelajar Aktif</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{reportData.pelajars.tidakAktif || 0}</div>
            <div className="text-sm text-gray-600">Tidak Aktif</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600 mb-2">{reportData.pelajars.cuti || 0}</div>
            <div className="text-sm text-gray-600">Cuti</div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderYuranReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Kutipan Yuran Bulanan</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {(reportData.yuran.byMonth || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <span className="text-sm font-medium text-gray-900">RM {item.amount.toLocaleString()}</span>
                </div>
              ))}
              {(reportData.yuran.byMonth || []).length === 0 && <p className="text-sm text-gray-500">Tiada data bulanan.</p>}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Status Pembayaran</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Terbayar</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="success">{reportData.yuran.terbayar || 0}</Badge>
                  <span className="text-sm font-medium text-gray-900">RM {(reportData.yuran.totalKutipan || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tunggak</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="danger">{reportData.yuran.tunggak || 0}</Badge>
                  <span className="text-sm font-medium text-gray-900">RM {(reportData.yuran.totalTunggak || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );

  const renderKehadiranReport = () => (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <Card.Title>Kehadiran Mengikut Kelas</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {(reportData.kehadiran.byKelas || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.kelas}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full" 
                      style={{ width: `${item.rate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{item.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Trend Kehadiran Mingguan</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-3">
            {(reportData.kehadiran.trends || []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.week}</span>
                <span className="text-sm font-medium text-gray-900">{item.rate}%</span>
              </div>
            ))}
            {(reportData.kehadiran.trends || []).length === 0 && <p className="text-sm text-gray-500">Tiada data trend mingguan.</p>}
          </div>
        </Card.Content>
      </Card>
    </div>
  );

  const renderKeputusanReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Ringkasan Keputusan</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Jumlah Keputusan</span>
                <span className="text-sm font-medium text-gray-900">{reportData.keputusan.totalKeputusan || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Lulus</span>
                <span className="text-sm font-medium text-gray-900">{reportData.keputusan.lulusCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gagal</span>
                <span className="text-sm font-medium text-gray-900">{reportData.keputusan.gagalCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Purata Markah</span>
                <span className="text-sm font-medium text-gray-900">{reportData.keputusan.averageMarkah || 0}</span>
              </div>
            </div>
          </Card.Content>
        </Card>
        {reportData.keputusan.topPerformer && (
          <Card>
            <Card.Header>
              <Card.Title>Pelajar Terbaik</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{reportData.keputusan.topPerformer.pelajar_nama}</h3>
                  <p className="text-sm text-gray-600">{reportData.keputusan.topPerformer.kelas_nama}</p>
                  <p className="text-sm text-gray-500">Markah: {reportData.keputusan.topPerformer.markah} ({reportData.keputusan.topPerformer.gred})</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (loading) {
      return <div className="text-center py-8">Memuatkan laporan...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-600">Ralat: {error.message || 'Gagal memuatkan data.'}</div>;
    }

    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'pelajars':
        return renderPelajarsReport();
      case 'yuran':
        return renderYuranReport();
      case 'kehadiran':
        return renderKehadiranReport();
      case 'keputusan':
        return renderKeputusanReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-emerald-600" />
            Laporan & Analisis
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Laporan
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="overview">Ringkasan Keseluruhan</option>
                <option value="pelajars">Laporan Pelajar</option>
                <option value="yuran">Laporan Yuran</option>
                <option value="kehadiran">Laporan Kehadiran</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarikh Mula
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarikh Akhir
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end space-x-2 sm:space-x-2">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                title="Pilih format fail"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
              </select>
              <Button onClick={generateReport} className="flex items-center w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Jana Laporan
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Report Content */}
      {renderReportContent()}

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>Jana Laporan Cepat</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="flex items-center justify-center p-4" onClick={() => { setSelectedReport('yuran'); setDateRange({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] }); }}>
              <FileText className="w-5 h-5 mr-2" />
              Laporan Bulanan
            </Button>
            <Button variant="outline" className="flex items-center justify-center p-4" onClick={() => setSelectedReport('pelajars')}>
              <Users className="w-5 h-5 mr-2" />
              Senarai Pelajar
            </Button>
            <Button variant="outline" className="flex items-center justify-center p-4" onClick={() => setSelectedReport('yuran')}>
              <CreditCard className="w-5 h-5 mr-2" />
              Laporan Kewangan
            </Button>
            <Button variant="outline" className="flex items-center justify-center p-4" onClick={() => setSelectedReport('kehadiran')}>
              <Calendar className="w-5 h-5 mr-2" />
              Laporan Kehadiran
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Laporan;
