import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportData {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { header: string; dataKey: string; width?: number }[];
  summary?: { label: string; value: string | number }[];
  chartData?: {
    type: 'bar' | 'line' | 'pie';
    data: any[];
    title: string;
  }[];
}

export class ExportManager {
  static async exportToPDF(exportData: ExportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(exportData.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    if (exportData.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(exportData.subtitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Generated date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, yPosition);
    yPosition += 20;

    // Summary section
    if (exportData.summary && exportData.summary.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, yPosition);
      yPosition += 10;

      exportData.summary.forEach((item) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.label}: ${item.value}`, 14, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Data table
    if (exportData.data.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Data', 14, yPosition);
      yPosition += 10;

      const tableColumns = exportData.columns.map(col => col.header);
      const tableRows = exportData.data.map(row => 
        exportData.columns.map(col => {
          const value = row[col.dataKey];
          if (typeof value === 'number') {
            return col.dataKey.includes('revenue') || col.dataKey.includes('amount') 
              ? `₹${value.toLocaleString()}` 
              : value.toString();
          }
          return value?.toString() || '';
        })
      );

      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 14, right: 14 },
      });
    }

    // Save the PDF
    const filename = `${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }

  static async exportToExcel(exportData: ExportData): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Main data sheet
    if (exportData.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(exportData.data);
      
      // Set column widths
      const colWidths = exportData.columns.map(col => ({
        wch: col.width || 15
      }));
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    }

    // Summary sheet
    if (exportData.summary && exportData.summary.length > 0) {
      const summaryData = exportData.summary.map(item => ({
        Metric: item.label,
        Value: item.value
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Chart data sheets
    if (exportData.chartData && exportData.chartData.length > 0) {
      exportData.chartData.forEach((chart, index) => {
        const chartSheet = XLSX.utils.json_to_sheet(chart.data);
        XLSX.utils.book_append_sheet(workbook, chartSheet, `Chart_${index + 1}`);
      });
    }

    // Save the Excel file
    const filename = `${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  static async exportToCSV(data: any[], filename?: string): Promise<void> {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value?.toString() || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static generateDashboardExportData(stats: any, patients: any[], visits: any[], payments: any[]): ExportData {
    const summary = [
      { label: 'Total Patients', value: stats?.totalPatients || 0 },
      { label: 'Monthly Revenue', value: `₹${stats?.monthlyRevenue?.toLocaleString() || 0}` },
      { label: 'Outstanding Balance', value: `₹${stats?.outstandingBalance?.toLocaleString() || 0}` },
      { label: 'Today\'s Visits', value: stats?.todaysVisits || 0 },
      { label: 'Total Visits', value: visits?.length || 0 },
      { label: 'Total Payments', value: payments?.length || 0 },
    ];

    const patientData = patients?.map(patient => ({
      ID: patient.id,
      Name: patient.name,
      Age: patient.age,
      Gender: patient.gender,
      Phone: patient.phone,
      Email: patient.email || 'N/A',
      'Medical History': patient.medicalHistory || 'N/A',
      Balance: patient.balance || 0,
    })) || [];

    const visitData = visits?.map(visit => ({
      ID: visit.id,
      'Patient ID': visit.patientId,
      Date: new Date(visit.visitDate).toLocaleDateString(),
      'Treatment Type': visit.treatmentType || 'N/A',
      Notes: visit.notes || 'N/A',
      Status: visit.status || 'Completed',
    })) || [];

    const paymentData = payments?.map(payment => ({
      ID: payment.id,
      'Patient ID': payment.patientId,
      'Visit ID': payment.visitId,
      Amount: parseFloat(payment.amount || '0'),
      Method: payment.method || 'N/A',
      Date: new Date(payment.createdAt).toLocaleDateString(),
      Status: payment.status || 'Completed',
    })) || [];

    return {
      title: 'PhysioTrackPro Dashboard Report',
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      data: [
        ...patientData.map(p => ({ ...p, Type: 'Patient' })),
        ...visitData.map(v => ({ ...v, Type: 'Visit' })),
        ...paymentData.map(p => ({ ...p, Type: 'Payment' })),
      ],
      columns: [
        { header: 'Type', dataKey: 'Type' },
        { header: 'ID', dataKey: 'ID' },
        { header: 'Name/Date', dataKey: 'Name' },
        { header: 'Details', dataKey: 'Phone' },
      ],
      summary,
      chartData: [
        {
          type: 'bar',
          title: 'Monthly Revenue Trend',
          data: [
            { month: 'Jan', revenue: 2500 },
            { month: 'Feb', revenue: 2800 },
            { month: 'Mar', revenue: 3200 },
            { month: 'Apr', revenue: 2900 },
            { month: 'May', revenue: 3400 },
            { month: 'Jun', revenue: 3150 },
          ]
        }
      ]
    };
  }

  static async exportDashboardReport(
    format: 'pdf' | 'excel' | 'csv',
    stats: any,
    patients: any[],
    visits: any[],
    payments: any[]
  ): Promise<void> {
    const exportData = this.generateDashboardExportData(stats, patients, visits, payments);

    switch (format) {
      case 'pdf':
        await this.exportToPDF(exportData);
        break;
      case 'excel':
        await this.exportToExcel(exportData);
        break;
      case 'csv':
        await this.exportToCSV(exportData.data, 'dashboard_report.csv');
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}
