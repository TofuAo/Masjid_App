// Finance Intelligence Helper Functions

/**
 * Calculate executive summary metrics from reports
 */
export const calculateExecutiveSummary = (reports) => {
  if (!reports || reports.length === 0) {
    return {
      totalOutstanding: 0,
      totalCollectedThisYear: 0,
      approvalPending: 0,
      collectionRate: 0,
      status: 'unknown'
    };
  }

  const currentYear = new Date().getFullYear();
  const currentYearReports = reports.filter(r => r.tahun === currentYear);
  
  // Calculate total outstanding (unapproved months)
  const unapprovedReports = reports.filter(r => 
    r.confirmation_status !== 'confirmed' && r.canConfirm
  );
  const totalOutstanding = unapprovedReports.reduce((sum, r) => {
    const unpaidAmount = (r.total_amount || 0) - ((r.paid_amount || 0));
    return sum + Math.max(0, unpaidAmount);
  }, 0);

  // Calculate total collected this year
  const totalCollectedThisYear = currentYearReports.reduce((sum, r) => {
    return sum + (r.total_amount || 0);
  }, 0);

  // Count approval pending (months/payments)
  const approvalPending = unapprovedReports.length;

  // Calculate collection rate
  const totalExpected = currentYearReports.reduce((sum, r) => {
    return sum + (r.total_amount || 0);
  }, 0);
  const totalPaid = currentYearReports.reduce((sum, r) => {
    return sum + (r.paid_amount || r.total_amount * (r.paid_count || 0) / Math.max(1, r.total_payments || 1));
  }, 0);
  const collectionRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

  // Determine status
  let status = 'good';
  if (collectionRate < 70) status = 'critical';
  else if (collectionRate < 85) status = 'warning';
  else status = 'good';

  return {
    totalOutstanding,
    totalCollectedThisYear,
    approvalPending,
    collectionRate: Math.round(collectionRate * 10) / 10,
    status
  };
};

/**
 * Get alerts for a report
 */
export const getReportAlerts = (report, previousReport = null) => {
  const alerts = [];

  // Calculate collection rate
  const totalAmount = report.total_amount || 0;
  const paidAmount = report.paid_amount || (totalAmount * (report.paid_count || 0) / Math.max(1, report.total_payments || 1));
  const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Low collection rate warning
  if (collectionRate < 70) {
    alerts.push({
      type: 'error',
      severity: 'high',
      message: `Kadar kutipan rendah: ${collectionRate.toFixed(1)}%`,
      icon: 'AlertCircle'
    });
  }

  // Overdue approval alerts
  if (report.confirmation_period_end) {
    const endDate = new Date(report.confirmation_period_end);
    const now = new Date();
    const daysPastDue = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));
    if (daysPastDue > 0 && report.confirmation_status !== 'confirmed') {
      alerts.push({
        type: 'warning',
        severity: 'high',
        message: `Lewat ${daysPastDue} hari dari tempoh pengesahan`,
        icon: 'Clock'
      });
    }
  }

  // Unusual changes vs previous month
  if (previousReport) {
    const prevAmount = previousReport.total_amount || 0;
    const currentAmount = report.total_amount || 0;
    if (prevAmount > 0) {
      const changePercent = ((currentAmount - prevAmount) / prevAmount) * 100;
      if (Math.abs(changePercent) > 20) {
        alerts.push({
          type: 'info',
          severity: 'medium',
          message: `Perubahan ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}% dari bulan sebelumnya`,
          icon: 'TrendingUp'
        });
      }
    }
  }

  // Missing documents warnings
  const unpaidCount = (report.total_payments || 0) - (report.paid_count || 0);
  if (unpaidCount > 0) {
    alerts.push({
      type: 'warning',
      severity: 'medium',
      message: `${unpaidCount} pembayaran belum mempunyai dokumen`,
      icon: 'FileText'
    });
  }

  return alerts;
};

/**
 * Get trend data for last N months
 */
export const getTrendData = (reports, months = 5) => {
  if (!reports || reports.length === 0) return [];

  // Sort by year and month
  const sortedReports = [...reports].sort((a, b) => {
    if (a.tahun !== b.tahun) return b.tahun - a.tahun;
    const monthsOrder = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 
                         'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
    return monthsOrder.indexOf(b.bulan) - monthsOrder.indexOf(a.bulan);
  });

  return sortedReports.slice(0, months).map(report => ({
    month: report.bulan,
    year: report.tahun,
    totalPayments: report.total_payments || 0,
    paidCount: report.paid_count || 0,
    totalAmount: report.total_amount || 0,
    collectionRate: report.total_amount > 0 
      ? ((report.paid_amount || (report.total_amount * (report.paid_count || 0) / Math.max(1, report.total_payments || 1))) / report.total_amount) * 100
      : 0
  }));
};

/**
 * Export to Excel (CSV format)
 */
export const handleExportExcel = (report, payments) => {
  if (!report || !payments) {
    return;
  }

  // Create CSV content
  const headers = ['Pelajar', 'Kelas', 'Jumlah', 'Status', 'Tarikh Bayar', 'Cara Bayar', 'No. Resit', 'Status Dokumen'];
  const rows = payments.map(p => [
    p.pelajar_nama || '',
    p.nama_kelas || '',
    p.jumlah || 0,
    p.status || '',
    p.tarikh_bayar || '',
    p.cara_bayar || '',
    p.no_resit || '',
    p.document_confirmed ? 'Disahkan' : 'Menunggu'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `laporan_${report.bulan}_${report.tahun}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export to PDF (placeholder - requires backend)
 */
export const handleExportPDF = (report, payments) => {
  // This is a placeholder - actual PDF generation should be done on backend
  console.log('PDF export requested for:', report.bulan, report.tahun);
  // In a real implementation, this would call a backend endpoint
  // that generates and returns a PDF file
};
