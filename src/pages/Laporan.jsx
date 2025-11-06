import React, { useState, useEffect, useCallback } from 'react';
import useCrud from '../hooks/useCrud';
import { studentsAPI, teachersAPI, classesAPI, feesAPI, attendanceAPI, resultsAPI } from '../services/api';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { BarChart3, Download, FileText, Users, GraduationCap, BookOpen, CreditCard, Calendar, TrendingUp, TrendingDown, AlertCircle, Award } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

const Laporan = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01', // Default to start of year
    end: new Date().toISOString().split('T')[0] // Default to current date
  });
  const [format, setFormat] = useState('xlsx'); // xlsx | docx | csv | json

  const { items: students, loading: loadingStudents, error: errorStudents, fetchItems: fetchStudents } = useCrud(studentsAPI, 'pelajar');
  const { items: teachers, loading: loadingTeachers, error: errorTeachers, fetchItems: fetchTeachers } = useCrud(teachersAPI, 'guru');
  const { items: classes, loading: loadingClasses, error: errorClasses, fetchItems: fetchClasses } = useCrud(classesAPI, 'kelas');
  const { items: fees, loading: loadingFees, error: errorFees, fetchItems: fetchFees } = useCrud(feesAPI, 'yuran');
  const { items: attendance, loading: loadingAttendance, error: errorAttendance, fetchItems: fetchAttendance } = useCrud(attendanceAPI, 'kehadiran');
  const { items: results, loading: loadingResults, error: errorResults, fetchItems: fetchResults } = useCrud(resultsAPI, 'keputusan');
  
  // Stats from APIs
  const [studentsStats, setStudentsStats] = useState(null);
  const [teachersStats, setTeachersStats] = useState(null);
  const [classesStats, setClassesStats] = useState(null);
  const [feesStats, setFeesStats] = useState(null);

  const loading = loadingStudents || loadingTeachers || loadingClasses || loadingFees || loadingAttendance || loadingResults;
  const error = errorStudents || errorTeachers || errorClasses || errorFees || errorAttendance || errorResults;

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchStudents({ limit: 1000 }),
        fetchTeachers({ limit: 1000 }),
        fetchClasses({ limit: 1000 }),
        fetchFees({ limit: 1000 }),
        fetchAttendance({ limit: 1000 }),
        fetchResults({ limit: 1000 })
      ]);
      
      // Fetch stats from APIs
      try {
        const [studentsStatsRes, teachersStatsRes, classesStatsRes, feesStatsRes] = await Promise.all([
          studentsAPI.getStats(),
          teachersAPI.getStats(),
          classesAPI.getStats(),
          feesAPI.getStats()
        ]);
        
        if (studentsStatsRes?.success && studentsStatsRes?.data) setStudentsStats(studentsStatsRes.data);
        if (teachersStatsRes?.success && teachersStatsRes?.data) setTeachersStats(teachersStatsRes.data);
        if (classesStatsRes?.success && classesStatsRes?.data) setClassesStats(classesStatsRes.data);
        if (feesStatsRes?.success && feesStatsRes?.data) setFeesStats(feesStatsRes.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchAllData();
  }, [fetchStudents, fetchTeachers, fetchClasses, fetchFees, fetchAttendance, fetchResults]);

  const getReportData = () => {
    const studentsArray = Array.isArray(students) ? students : [];
    const teachersArray = Array.isArray(teachers) ? teachers : [];
    const classesArray = Array.isArray(classes) ? classes : [];
    const feesArray = Array.isArray(fees) ? fees : [];
    const attendanceArray = Array.isArray(attendance) ? attendance : [];
    const resultsArray = Array.isArray(results) ? results : [];

    // Use stats from API if available, otherwise calculate from arrays
    const totalPelajars = studentsStats?.total || studentsArray.length;
    const aktifPelajars = studentsStats?.active || studentsArray.filter(s => s.status === 'aktif').length;
    const totalGurus = teachersStats?.total || teachersArray.length;
    const totalKelass = classesStats?.total || classesArray.length;
    const totalYuranCollected = feesArray.filter(f => f.status === 'terbayar' || f.status === 'Bayar').reduce((sum, f) => sum + (Number(f.jumlah) || 0), 0);
    const totalAttendanceRecords = attendanceArray.length;
    const presentAttendance = attendanceArray.filter(a => a.status === 'hadir' || a.status === 'lewat').length;
    const attendanceRate = totalAttendanceRecords > 0 ? (presentAttendance / totalAttendanceRecords * 100).toFixed(1) : 0;
    const totalResults = resultsArray.length;
    const passedResults = resultsArray.filter(r => r.status === 'lulus').length;
    const passRate = totalResults > 0 ? (passedResults / totalResults * 100).toFixed(1) : 0;

    // Group classes by level for Kelas Pengajian report
    const levelOrder = ['ASAS', 'Asas', 'TAHSIN ASAS', 'PERTENGAHAN', 'LANJUTAN', 'TAHSIN LANJUTAN', 'TALAQQI'];
    const classesByLevel = {};
    
    classesArray.forEach(c => {
      const level = c.level || '';
      const levelKey = level.toUpperCase();
      if (!classesByLevel[levelKey]) {
        classesByLevel[levelKey] = {
          level: level,
          classes: [],
          totalStudents: 0
        };
      }
      const studentCount = studentsArray.filter(s => s.kelas_id === c.id).length;
      classesByLevel[levelKey].classes.push({
        ...c,
        student_count: studentCount,
        guru_nama: c.guru_nama || teachersArray.find(t => t.ic === c.guru_ic)?.nama || 'Tiada Guru'
      });
      classesByLevel[levelKey].totalStudents += studentCount;
    });

    // Sort classes within each level by teacher name
    Object.keys(classesByLevel).forEach(levelKey => {
      classesByLevel[levelKey].classes.sort((a, b) => {
        const nameA = a.guru_nama || '';
        const nameB = b.guru_nama || '';
        return nameA.localeCompare(nameB);
      });
    });

    // Group TALAQQI by schedule (ISNIN & RABU vs SELASA & KHAMIS)
    const talaqqiClasses = classesByLevel['TALAQQI']?.classes || [];
    const talaqqiBySchedule = {
      'IR': { // ISNIN & RABU
        classes: talaqqiClasses.filter(c => c.jadual && (c.jadual.includes('ISNIN') || c.jadual.includes('RABU'))),
        totalStudents: 0
      },
      'SK': { // SELASA & KHAMIS
        classes: talaqqiClasses.filter(c => c.jadual && (c.jadual.includes('SELASA') || c.jadual.includes('KHAMIS'))),
        totalStudents: 0
      }
    };
    talaqqiBySchedule['IR'].totalStudents = talaqqiBySchedule['IR'].classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
    talaqqiBySchedule['SK'].totalStudents = talaqqiBySchedule['SK'].classes.reduce((sum, c) => sum + (c.student_count || 0), 0);

    // Group teachers with their classes
    const teachersWithClasses = teachersArray.map(teacher => {
      const teacherClasses = classesArray
        .filter(c => c.guru_ic === teacher.ic)
        .map(c => ({
          ...c,
          student_count: studentsArray.filter(s => s.kelas_id === c.id).length
        }))
        .sort((a, b) => {
          // Sort by level priority
          const levelOrder = ['ASAS', 'TAHSIN ASAS', 'PERTENGAHAN', 'LANJUTAN', 'TAHSIN LANJUTAN', 'TALAQQI'];
          const aLevel = levelOrder.indexOf(a.level?.toUpperCase()) !== -1 ? levelOrder.indexOf(a.level?.toUpperCase()) : 999;
          const bLevel = levelOrder.indexOf(b.level?.toUpperCase()) !== -1 ? levelOrder.indexOf(b.level?.toUpperCase()) : 999;
          if (aLevel !== bLevel) return aLevel - bLevel;
          return (a.nama_kelas || '').localeCompare(b.nama_kelas || '');
        });
      
      return {
        ...teacher,
        classes: teacherClasses,
        totalClasses: teacherClasses.length,
        totalStudents: teacherClasses.reduce((sum, c) => sum + (c.student_count || 0), 0)
      };
    }).filter(t => t.classes.length > 0).sort((a, b) => a.nama.localeCompare(b.nama));

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
          kelas: c.nama_kelas || c.class_name || '',
          count: studentsArray.filter(s => s.kelas_id === c.id).length,
        })),
      },
      kelasPengajian: {
        byLevel: classesByLevel,
        talaqqiBySchedule: talaqqiBySchedule,
        teachersWithClasses: teachersWithClasses,
        summary: Object.keys(classesByLevel).map(levelKey => ({
          level: classesByLevel[levelKey].level,
          bilKelas: classesByLevel[levelKey].classes.length,
          bilPelajar: classesByLevel[levelKey].totalStudents
        })).sort((a, b) => {
          const aIndex = levelOrder.findIndex(l => l.toUpperCase() === a.level.toUpperCase());
          const bIndex = levelOrder.findIndex(l => l.toUpperCase() === b.level.toUpperCase());
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        })
      },
      yuran: {
        totalKutipan: totalYuranCollected,
        totalTunggak: feesArray.filter(f => !f.status || f.status === 'tunggak' || f.status === 'Belum Bayar').reduce((sum, f) => sum + (Number(f.jumlah) || 0), 0),
        terbayar: feesArray.filter(f => f.status === 'terbayar' || f.status === 'Bayar').length,
        tunggak: feesArray.filter(f => !f.status || f.status === 'tunggak' || f.status === 'Belum Bayar').length,
        byMonth: [], // This would require more complex aggregation on the backend or frontend
      },
      kehadiran: {
        averageRate: attendanceRate,
        byKelas: classesArray.map(c => {
          const classAttendance = attendanceArray.filter(a => a.kelas_id === c.id);
          const classPresent = classAttendance.filter(a => a.status === 'hadir' || a.status === 'lewat').length;
          const rate = classAttendance.length > 0 ? (classPresent / classAttendance.length * 100).toFixed(1) : 0;
          return { kelas: c.nama_kelas || c.class_name || '', rate };
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
        // Filter by date range if provided
        const filtered = arr.filter(a => {
          if (!a.tarikh) return false;
          const attendanceDate = new Date(a.tarikh);
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          // Set end date to end of day for inclusive comparison
          endDate.setHours(23, 59, 59, 999);
          return attendanceDate >= startDate && attendanceDate <= endDate;
        });
        // Sort by date (newest first), then by student name
        filtered.sort((a, b) => {
          const dateCompare = new Date(b.tarikh || 0) - new Date(a.tarikh || 0);
          if (dateCompare !== 0) return dateCompare;
          const nameA = (a.pelajar_nama || a.nama || '').toLowerCase();
          const nameB = (b.pelajar_nama || b.nama || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        return filtered.map(a => ({
          'No. IC': a.pelajar_ic || a.student_ic || '',
          Pelajar: a.pelajar_nama || a.nama || '',
          Kelas: a.kelas_nama || a.nama_kelas || '',
          Tarikh: a.tarikh ? new Date(a.tarikh).toLocaleDateString('ms-MY') : '',
          Status: a.status || ''
        }));
      }
      case 'keputusan': {
        const arr = Array.isArray(results) ? results : [];
        return arr.map(r => ({
          Pelajar: r.pelajar_nama || r.nama || '',
          Kelas: r.kelas_nama || r.nama_kelas || '',
          Peperiksaan: r.peperiksaan_nama || r.exam_subject || r.subject || '',
          Markah: r.markah || 0,
          Gred: r.gred || '',
          Status: r.status || (r.gred && ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'].includes(r.gred) ? 'lulus' : 'gagal')
        }));
      }
      case 'kelasPengajian': {
        // Return summary data for Kelas Pengajian report
        const summary = reportData.kelasPengajian?.summary || [];
        return summary.map((item, index) => ({
          'BIL.': index + 1,
          'PERINGKAT': item.level,
          'BIL. KELAS': item.bilKelas,
          'BIL. PELAJAR': item.bilPelajar
        }));
      }
      case 'overview':
      default: {
        const r = reportData.overview || {};
        return [
          { Metrik: 'Jumlah Pelajar', Nilai: r.totalPelajars || 0 },
          { Metrik: 'Pelajar Aktif', Nilai: reportData.pelajars?.aktif || 0 },
          { Metrik: 'Jumlah Guru', Nilai: r.totalGurus || 0 },
          { Metrik: 'Jumlah Kelas', Nilai: r.totalKelass || 0 },
          { Metrik: 'Kutipan Yuran (RM)', Nilai: r.totalYuran || 0 },
          { Metrik: 'Kadar Kehadiran (%)', Nilai: r.kehadiranRate || 0 },
          { Metrik: 'Kadar Lulus (%)', Nilai: r.lulusRate || 0 },
        ];
      }
    }
  };

  const generateWordReport = async (rows, reportData) => {
    const reportTitle = {
      'overview': 'Ringkasan Keseluruhan',
      'pelajars': 'Laporan Pelajar',
      'yuran': 'Laporan Yuran',
      'kehadiran': 'Laporan Kehadiran',
      'keputusan': 'Laporan Keputusan'
    }[selectedReport] || 'Laporan';

    const children = [
      new Paragraph({
        text: 'MASJID APP - SISTEM PENGURUSAN KELAS',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: reportTitle,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),
      new Paragraph({
        text: `Tarikh Mula: ${new Date(dateRange.start).toLocaleDateString('ms-MY')}`,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `Tarikh Akhir: ${new Date(dateRange.end).toLocaleDateString('ms-MY')}`,
        spacing: { after: 300 }
      }),
    ];

    // Add summary data for overview report
    if (selectedReport === 'overview') {
      children.push(
        new Paragraph({
          text: 'STATISTIK KESELURUHAN',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 }
        })
      );
      
      const summaryRows = [
        ['Metrik', 'Nilai'],
        ['Jumlah Pelajar', String(reportData.overview?.totalPelajars || 0)],
        ['Pelajar Aktif', String(reportData.pelajars?.aktif || 0)],
        ['Pelajar Baru (Bulan Ini)', String(reportData.pelajars?.newThisMonth || 0)],
        ['Jumlah Guru', String(reportData.overview?.totalGurus || 0)],
        ['Jumlah Kelas', String(reportData.overview?.totalKelass || 0)],
        ['Kutipan Yuran (RM)', String(reportData.overview?.totalYuran || 0)],
        ['Yuran Tertunggak (RM)', String(reportData.yuran?.totalTunggak || 0)],
        ['Kadar Kehadiran (%)', `${reportData.overview?.kehadiranRate || 0}%`],
        ['Kadar Lulus (%)', `${reportData.overview?.lulusRate || 0}%`],
        ['Purata Markah', String(reportData.keputusan?.averageMarkah || 0)]
      ];

      const tableRows = summaryRows.map((row, index) => 
        new TableRow({
          children: row.map(cell => 
            new TableCell({
              children: [new Paragraph(cell)],
              width: { size: 50, type: WidthType.PERCENTAGE }
            })
          )
        })
      );

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      );
    }

    // Add data table
    if (rows && rows.length > 0) {
      children.push(
        new Paragraph({
          text: 'DATA TERPERINCI',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        })
      );

      const headers = Object.keys(rows[0]);
      const tableRows = [
        new TableRow({
          children: headers.map(header => 
            new TableCell({
              children: [new Paragraph({
                text: header,
                bold: true
              })],
              shading: { fill: 'D3D3D3' }
            })
          )
        }),
        ...rows.slice(0, 100).map(row => // Limit to 100 rows for Word document
          new TableRow({
            children: headers.map(header => 
              new TableCell({
                children: [new Paragraph(String(row[header] || ''))]
              })
            )
          })
        )
      ];

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      );

      if (rows.length > 100) {
        children.push(
          new Paragraph({
            text: `*Nota: Paparan terhad kepada 100 rekod pertama daripada ${rows.length} rekod.`,
            italics: true,
            spacing: { before: 200 }
          })
        );
      }
    }

    // Add footer
    children.push(
      new Paragraph({
        text: `\nDijana pada: ${new Date().toLocaleString('ms-MY')}`,
        spacing: { before: 400 }
      })
    );

    const doc = new Document({
      sections: [{
        children: children
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `laporan_${selectedReport}_${dateRange.start}_${dateRange.end}.docx`);
  };

  const generateReport = async () => {
    try {
      toast.info('Menjana laporan...', { autoClose: 1000 });
      const rows = buildRows();
      if (!rows || rows.length === 0) {
        toast.error('Tiada data untuk dijana.');
        return;
      }
      const filenameBase = `laporan_${selectedReport}_${dateRange.start}_${dateRange.end}`;

      // Word Document Generation
      if (format === 'docx') {
        try {
          await generateWordReport(rows, reportData);
          toast.success('Laporan Word berjaya dijana!');
          return;
        } catch (e) {
          console.error('Word generation error:', e);
          toast.error('Gagal menjana laporan Word. Cuba format lain.');
          return;
        }
      }

      // Excel Generation with enhanced formatting
      if (format === 'xlsx') {
        try {
          const XLSX = await import('xlsx');
          const wb = XLSX.utils.book_new();

          // Main data sheet
          const ws = XLSX.utils.json_to_sheet(rows);
          
          // Set column widths
          const colWidths = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }));
          ws['!cols'] = colWidths;

          XLSX.utils.book_append_sheet(wb, ws, 'Data');

          // Add summary sheet for overview
          if (selectedReport === 'overview') {
            const summaryData = [
              ['STATISTIK KESELURUHAN', ''],
              ['Jumlah Pelajar', reportData.overview?.totalPelajars || 0],
              ['Pelajar Aktif', reportData.pelajars?.aktif || 0],
              ['Pelajar Baru (Bulan Ini)', reportData.pelajars?.newThisMonth || 0],
              ['Jumlah Guru', reportData.overview?.totalGurus || 0],
              ['Jumlah Kelas', reportData.overview?.totalKelass || 0],
              ['Kutipan Yuran (RM)', reportData.overview?.totalYuran || 0],
              ['Yuran Tertunggak (RM)', reportData.yuran?.totalTunggak || 0],
              ['Yuran Terbayar', reportData.yuran?.terbayar || 0],
              ['Yuran Tertunggak', reportData.yuran?.tunggak || 0],
              ['Kadar Kehadiran (%)', `${reportData.overview?.kehadiranRate || 0}%`],
              ['Kadar Lulus (%)', `${reportData.overview?.lulusRate || 0}%`],
              ['Purata Markah', reportData.keputusan?.averageMarkah || 0],
              ['Lulus', reportData.keputusan?.lulus || 0],
              ['Gagal', reportData.keputusan?.gagal || 0]
            ];
            const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
            summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');
          }
          
          // Add class distribution sheet for pelajars report
          if (selectedReport === 'pelajars' && reportData.pelajars?.byKelas?.length > 0) {
            const classData = [
              ['Kelas', 'Bilangan Pelajar'],
              ...reportData.pelajars.byKelas.map(item => [item.kelas || '', item.count || 0])
            ];
            const classWs = XLSX.utils.aoa_to_sheet(classData);
            classWs['!cols'] = [{ wch: 30 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, classWs, 'Taburan Kelas');
          }
          
          // Add attendance by class sheet for kehadiran report
          if (selectedReport === 'kehadiran' && reportData.kehadiran?.byKelas?.length > 0) {
            const attendanceData = [
              ['Kelas', 'Kadar Kehadiran (%)'],
              ...reportData.kehadiran.byKelas.map(item => [item.kelas || '', `${item.rate || 0}%`])
            ];
            const attendanceWs = XLSX.utils.aoa_to_sheet(attendanceData);
            attendanceWs['!cols'] = [{ wch: 30 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, attendanceWs, 'Kehadiran Kelas');
          }

          XLSX.writeFile(wb, `${filenameBase}.xlsx`);
          toast.success('Laporan Excel berjaya dijana!');
          return;
        } catch (e) {
          console.error('Excel generation error:', e);
          toast.error('Gagal menjana laporan Excel. Cuba format lain.');
          // fall through to CSV
        }
      }

      // CSV Generation
      if (format === 'csv') {
        const header = Object.keys(rows[0]);
        const csv = [header.join(',')].concat(rows.map(r => header.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compatibility
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenameBase}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Laporan CSV berjaya dijana!');
        return;
      }

      // JSON fallback
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameBase}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Laporan JSON berjaya dijana!');
    } catch (err) {
      console.error('Generate report error:', err);
      toast.error('Gagal menjana laporan. Sila cuba lagi.');
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
                <span className="text-sm font-medium text-gray-900">{teachersStats?.aktif || reportData.overview.totalGurus || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Guru Cuti</span>
                <span className="text-sm font-medium text-gray-900">{teachersStats?.cuti || 0}</span>
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
                <span className="text-sm font-medium text-gray-900">{classesStats?.aktif || reportData.overview.totalKelass || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kelas Penuh</span>
                <span className="text-sm font-medium text-gray-900">{classesStats?.penuh || 0}</span>
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
                RM {Number(reportData.overview.totalYuran || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <span className="text-sm font-medium text-gray-900">RM {Number(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                  <span className="text-sm font-medium text-gray-900">RM {Number(reportData.yuran.totalKutipan || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tunggak</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="danger">{reportData.yuran.tunggak || 0}</Badge>
                  <span className="text-sm font-medium text-gray-900">RM {Number(reportData.yuran.totalTunggak || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );

  const renderKehadiranReport = () => {
    const attendanceArray = Array.isArray(attendance) ? attendance : [];
    // Filter by date range
    const filteredAttendance = attendanceArray.filter(a => {
      if (!a.tarikh) return false;
      const attendanceDate = new Date(a.tarikh);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      return attendanceDate >= startDate && attendanceDate <= endDate;
    });

    // Group attendance by student for summary
    const attendanceByStudent = {};
    filteredAttendance.forEach(a => {
      const studentKey = a.pelajar_ic || a.student_ic || '';
      if (!attendanceByStudent[studentKey]) {
        attendanceByStudent[studentKey] = {
          nama: a.pelajar_nama || a.nama || '',
          kelas: a.kelas_nama || a.nama_kelas || '',
          ic: studentKey,
          total: 0,
          hadir: 0,
          tidakHadir: 0,
          lewat: 0,
          sakit: 0,
          cuti: 0
        };
      }
      attendanceByStudent[studentKey].total++;
      const status = (a.status || '').toLowerCase();
      if (status === 'hadir') attendanceByStudent[studentKey].hadir++;
      else if (status === 'tidak hadir') attendanceByStudent[studentKey].tidakHadir++;
      else if (status === 'lewat') attendanceByStudent[studentKey].lewat++;
      else if (status === 'sakit') attendanceByStudent[studentKey].sakit++;
      else if (status === 'cuti') attendanceByStudent[studentKey].cuti++;
    });

    const studentSummary = Object.values(attendanceByStudent).sort((a, b) => 
      a.nama.localeCompare(b.nama)
    );

    return (
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <Card.Title>Ringkasan Kehadiran Pelajar</Card.Title>
            <p className="text-sm text-gray-600 mt-1">
              Tarikh: {new Date(dateRange.start).toLocaleDateString('ms-MY')} - {new Date(dateRange.end).toLocaleDateString('ms-MY')}
            </p>
          </Card.Header>
          <Card.Content>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">No. IC</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nama Pelajar</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Kelas</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Jumlah</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Hadir</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Tidak Hadir</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Lewat</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Sakit</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Cuti</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Kadar (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentSummary.map((student, index) => {
                    const rate = student.total > 0 
                      ? ((student.hadir + student.lewat) / student.total * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={student.ic || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{student.ic}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.nama}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{student.kelas}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{student.total}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{student.hadir}</td>
                        <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{student.tidakHadir}</td>
                        <td className="px-4 py-3 text-sm text-center text-yellow-600 font-medium">{student.lewat}</td>
                        <td className="px-4 py-3 text-sm text-center text-blue-600 font-medium">{student.sakit}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 font-medium">{student.cuti}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {studentSummary.length === 0 && (
                <p className="text-center text-gray-500 py-4">Tiada rekod kehadiran untuk tempoh yang dipilih.</p>
              )}
            </div>
          </Card.Content>
        </Card>

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
      </div>
    );
  };

  const renderKelasPengajianReport = () => {
    const { kelasPengajian } = reportData;
    const summary = kelasPengajian?.summary || [];
    const byLevel = kelasPengajian?.byLevel || {};
    const talaqqiBySchedule = kelasPengajian?.talaqqiBySchedule || {};
    const teachersWithClasses = kelasPengajian?.teachersWithClasses || [];

    const levelDisplayNames = {
      'ASAS': 'ASAS',
      'Asas': 'ASAS',
      'TAHSIN ASAS': 'TAHSIN ASAS',
      'PERTENGAHAN': 'PERTENGAHAN',
      'LANJUTAN': 'LANJUTAN',
      'TAHSIN LANJUTAN': 'TAHSIN LANJUTAN',
      'TALAQQI': 'TALAQQI'
    };

    const renderLevelSection = (levelKey) => {
      const levelData = byLevel[levelKey];
      if (!levelData || levelData.classes.length === 0) return null;

      const levelName = levelData.level;
      
      return (
        <Card key={levelKey} className="mb-6">
          <Card.Header>
            <Card.Title className="text-xl font-bold text-center">
              PERINGKAT {levelDisplayNames[levelKey] || levelKey}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">TENAGA PENGAJAR</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">JADUAL WAKTU KELAS</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL. PELAJAR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {levelData.classes.map((kelas, index) => (
                    <tr key={kelas.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{kelas.guru_nama || 'Tiada Guru'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{kelas.jadual || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{kelas.student_count || 0}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-100 font-bold">
                    <td colSpan="3" className="px-4 py-3 text-sm text-gray-900">JUMLAH KESELURUHAN</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{levelData.totalStudents}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      );
    };

    const renderTalaqqiSection = () => {
      const irClasses = talaqqiBySchedule['IR']?.classes || [];
      const skClasses = talaqqiBySchedule['SK']?.classes || [];

      return (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title className="text-xl font-bold text-center">
                PERINGKAT TALAQQI (ISNIN & RABU)
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL.</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">TENAGA PENGAJAR</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">JADUAL WAKTU KELAS</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL. PELAJAR</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {irClasses.map((kelas, index) => (
                      <tr key={kelas.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{kelas.guru_nama || 'Tiada Guru'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{kelas.jadual || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{kelas.student_count || 0}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-100 font-bold">
                      <td colSpan="3" className="px-4 py-3 text-sm text-gray-900">JUMLAH KESELURUHAN</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{irClasses.length}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{talaqqiBySchedule['IR']?.totalStudents || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="text-xl font-bold text-center">
                PERINGKAT TALAQQI (SELASA & KHAMIS)
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL. KELAS</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">TENAGA PENGAJAR</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">JADUAL WAKTU KELAS</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL. PELAJAR</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {skClasses.map((kelas, index) => (
                      <tr key={kelas.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{kelas.guru_nama || 'Tiada Guru'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{kelas.jadual || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{kelas.student_count || 0}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-100 font-bold">
                      <td colSpan="3" className="px-4 py-3 text-sm text-gray-900">JUMLAH KESELURUHAN</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{skClasses.length}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{talaqqiBySchedule['SK']?.totalStudents || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card.Content>
          </Card>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <Card.Header className="text-center">
            <Card.Title className="text-2xl font-bold">KELAS PENGAJIAN AL-QURAN DEWASA 2025</Card.Title>
            <p className="text-lg mt-2 text-gray-700">MASJID NEGERI SULTAN AHMAD 1 KUANTAN</p>
          </Card.Header>
        </Card>

        {/* Overview Summary */}
        <Card>
          <Card.Header>
            <Card.Title className="text-xl font-bold text-center">OVERVIEW</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">PERINGKAT</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL. KELAS</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">BIL. PELAJAR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.bilKelas}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.bilPelajar}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-100 font-bold">
                    <td colSpan="2" className="px-4 py-3 text-sm text-gray-900">JUMLAH KESELURUHAN</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{summary.reduce((sum, s) => sum + s.bilKelas, 0)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{summary.reduce((sum, s) => sum + s.bilPelajar, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>

        {/* Level Sections */}
        {['ASAS', 'Asas'].map(key => byLevel[key] && renderLevelSection(key)).filter(Boolean)}
        {renderLevelSection('TAHSIN ASAS')}
        {renderLevelSection('PERTENGAHAN')}
        {renderLevelSection('LANJUTAN')}
        {renderLevelSection('TAHSIN LANJUTAN')}
        {byLevel['TALAQQI'] && renderTalaqqiSection()}

        {/* Teachers Listing */}
        <Card>
          <Card.Header>
            <Card.Title className="text-xl font-bold text-center">TENAGA PENGAJAR</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">BIL.</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">TENAGA PENGAJAR</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">NO. TELEFON</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">PERINGKAT</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">WAKTU KELAS</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">LOKASI</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">KELAS</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">BIL. KELAS</th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase">BIL. PELAJAR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachersWithClasses.map((teacher, index) => (
                    teacher.classes.map((kelas, kelasIndex) => (
                      <tr key={`${teacher.ic}-${kelas.id}`} className="hover:bg-gray-50">
                        {kelasIndex === 0 && (
                          <>
                            <td rowSpan={teacher.classes.length} className="px-2 py-2 text-sm text-gray-900 align-top">{index + 1}</td>
                            <td rowSpan={teacher.classes.length} className="px-2 py-2 text-sm text-gray-900 align-top">{teacher.nama}</td>
                            <td rowSpan={teacher.classes.length} className="px-2 py-2 text-sm text-gray-700 align-top">{teacher.telefon || '-'}</td>
                          </>
                        )}
                        <td className="px-2 py-2 text-sm text-gray-700">
                          {kelas.level === 'ASAS' || kelas.level === 'Asas' ? 'A' :
                           kelas.level === 'TAHSIN ASAS' ? 'TA' :
                           kelas.level === 'PERTENGAHAN' ? 'P' :
                           kelas.level === 'LANJUTAN' ? 'L' :
                           kelas.level === 'TAHSIN LANJUTAN' ? 'TL' :
                           kelas.level === 'TALAQQI' ? 'T' : '-'}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700">
                          {kelas.jadual?.includes('ISNIN') ? 'IR' :
                           kelas.jadual?.includes('SELASA') ? 'SK' :
                           kelas.jadual?.includes('SABTU') ? 'SA' : '-'}
                          {' '}
                          {kelas.jadual?.includes('5.00 pm') || kelas.jadual?.includes('5:00') ? 'ptg' :
                           kelas.jadual?.includes('9.00 pm') || kelas.jadual?.includes('9:00 pm') ? 'mlm' :
                           kelas.jadual?.includes('9.00 am') || kelas.jadual?.includes('9:00 am') ? 'pg' : ''}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700">{kelas.nama_kelas || '-'}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{kelasIndex === 0 ? teacher.totalClasses : ''}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{kelas.student_count || 0}</td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  };

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
      case 'kelasPengajian':
        return renderKelasPengajianReport();
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
                <option value="kelasPengajian">Kelas Pengajian Al-Quran 2025</option>
                <option value="pelajars">Laporan Pelajar</option>
                <option value="yuran">Laporan Yuran</option>
                <option value="kehadiran">Laporan Kehadiran</option>
                <option value="keputusan">Laporan Keputusan</option>
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
                <option value="docx">Word (.docx)</option>
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
