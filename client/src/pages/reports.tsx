
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, Calendar, Users, DollarSign, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

export default function Reports() {
  const [reportType, setReportType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const { data: patients } = useQuery<any[]>({ queryKey: ["/api/patients"] });
  const { data: visits } = useQuery<any[]>({ queryKey: ["/api/visits"] });
  const { data: payments } = useQuery<any[]>({ queryKey: ["/api/payments"] });
  const { data: inventory } = useQuery<any[]>({ queryKey: ["/api/inventory"] });

  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      toast({
        title: "Success",
        description: `${filename} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const exportPatientsReport = () => {
    const patientsData = (patients || []).map((patient: any) => ({
      ID: patient.id,
      Name: patient.name,
      Age: patient.age,
      Gender: patient.gender,
      Phone: patient.phone,
      Email: patient.email || "",
      Address: patient.address || "",
      "Medical History": patient.medicalHistory || "",
      "Created Date": new Date(patient.createdAt).toLocaleDateString(),
    }));

    exportToExcel(patientsData, "Patients_Report", "Patients");
  };

  const exportVisitsReport = () => {
    const visitsData = (visits || []).map((visit: any) => ({
      ID: visit.id,
      "Patient Name": visit.patient?.name || "",
      "Visit Date": new Date(visit.visitDate).toLocaleDateString(),
      "Visit Time": new Date(visit.visitDate).toLocaleTimeString(),
      "Treatment Provided": visit.treatmentProvided,
      "Duration (min)": visit.duration,
      "Charges (₹)": parseFloat(visit.charges),
      "Symptoms": visit.symptoms || "",
      "Diagnosis": visit.diagnosis || "",
      "Prescription": visit.prescription || "",
      "Follow Up Date": visit.followUpDate ? new Date(visit.followUpDate).toLocaleDateString() : "",
      "Created Date": new Date(visit.createdAt).toLocaleDateString(),
    }));

    exportToExcel(visitsData, "Visits_Report", "Visits");
  };

  const exportPaymentsReport = () => {
    const paymentsData = (payments || []).map((payment: any) => ({
      ID: payment.id,
      "Patient Name": payment.patient?.name || "",
      "Visit ID": payment.visitId || "",
      "Amount (₹)": parseFloat(payment.amount),
      "Payment Type": payment.paymentType,
      "Payment Method": payment.paymentMethod,
      "Payment Date": new Date(payment.paymentDate).toLocaleDateString(),
      "Notes": payment.notes || "",
      "Created Date": new Date(payment.createdAt).toLocaleDateString(),
    }));

    exportToExcel(paymentsData, "Payments_Report", "Payments");
  };

  const exportInventoryReport = () => {
    const inventoryData = (inventory || []).map((item: any) => ({
      ID: item.id,
      Name: item.name,
      Category: item.category,
      "Current Stock": item.currentStock,
      "Min Stock Level": item.minStockLevel,
      "Unit Price (₹)": item.unitPrice ? parseFloat(item.unitPrice) : 0,
      "Total Value (₹)": item.currentStock * (item.unitPrice ? parseFloat(item.unitPrice) : 0),
      Supplier: item.supplier || "",
      Description: item.description || "",
      "Last Restocked": item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : "",
      "Stock Status": item.currentStock === 0 ? "Out of Stock" : 
                    item.currentStock <= item.minStockLevel ? "Low Stock" : "In Stock",
      "Created Date": new Date(item.createdAt).toLocaleDateString(),
    }));

    exportToExcel(inventoryData, "Inventory_Report", "Inventory");
  };

  const exportFinancialReport = () => {
    const financialData = (payments || []).map((payment: any) => ({
      "Payment ID": payment.id,
      "Patient Name": payment.patient?.name || "",
      "Date": new Date(payment.paymentDate).toLocaleDateString(),
      "Amount (₹)": parseFloat(payment.amount),
      "Type": payment.paymentType,
      "Method": payment.paymentMethod,
      "Month": new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }));

    exportToExcel(financialData, "Financial_Report", "Financial");
  };

  const exportAllData = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Patients sheet
      const patientsData = (patients || []).map((patient: any) => ({
        ID: patient.id,
        Name: patient.name,
        Age: patient.age,
        Gender: patient.gender,
        Phone: patient.phone,
        Email: patient.email || "",
        Address: patient.address || "",
        "Medical History": patient.medicalHistory || "",
        "Created Date": new Date(patient.createdAt).toLocaleDateString(),
      }));
      
      const patientsSheet = XLSX.utils.json_to_sheet(patientsData);
      XLSX.utils.book_append_sheet(workbook, patientsSheet, "Patients");

      // Visits sheet
      const visitsData = (visits || []).map((visit: any) => ({
        ID: visit.id,
        "Patient Name": visit.patient?.name || "",
        "Visit Date": new Date(visit.visitDate).toLocaleDateString(),
        "Treatment": visit.treatmentProvided,
        "Duration": visit.duration,
        "Charges": parseFloat(visit.charges),
      }));
      
      const visitsSheet = XLSX.utils.json_to_sheet(visitsData);
      XLSX.utils.book_append_sheet(workbook, visitsSheet, "Visits");

      // Payments sheet
      const paymentsData = (payments || []).map((payment: any) => ({
        ID: payment.id,
        "Patient Name": payment.patient?.name || "",
        "Amount": parseFloat(payment.amount),
        "Type": payment.paymentType,
        "Method": payment.paymentMethod,
        "Date": new Date(payment.paymentDate).toLocaleDateString(),
      }));
      
      const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
      XLSX.utils.book_append_sheet(workbook, paymentsSheet, "Payments");

      // Inventory sheet
      const inventoryData = (inventory || []).map((item: any) => ({
        ID: item.id,
        Name: item.name,
        Category: item.category,
        "Current Stock": item.currentStock,
        "Unit Price": item.unitPrice ? parseFloat(item.unitPrice) : 0,
        Supplier: item.supplier || "",
      }));
      
      const inventorySheet = XLSX.utils.json_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(workbook, inventorySheet, "Inventory");

      XLSX.writeFile(workbook, "Complete_Clinic_Report.xlsx");
      
      toast({
        title: "Success",
        description: "Complete report exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export complete report",
        variant: "destructive",
      });
    }
  };

  const getTotalPatients = () => (patients || []).length;
  const getTotalVisits = () => (visits || []).length;
  const getTotalRevenue = () => (payments || []).reduce((sum: number, payment: any) =>
    sum + parseFloat(payment.amount), 0);
  const getLowStockItems = () => (inventory || []).filter((item: any) =>
    item.currentStock <= item.minStockLevel).length;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark-slate)]">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Export and analyze clinic data</p>
        </div>
        <Button 
          onClick={exportAllData}
          className="bg-gradient-to-r from-[var(--health-green)] to-emerald-600 hover:shadow-lg transition-all"
        >
          <FileDown className="mr-2 w-4 h-4" />
          Export All Data
        </Button>
      </header>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">{getTotalPatients()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--medical-blue)] to-blue-600 flex items-center justify-center">
                  <Users className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Visits</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">{getTotalVisits()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-purple-600 flex items-center justify-center">
                  <Calendar className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">₹{getTotalRevenue().toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--health-green)] to-emerald-600 flex items-center justify-center">
                  <DollarSign className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Low Stock Items</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">{getLowStockItems()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--warning-amber)] to-orange-500 flex items-center justify-center">
                  <Package className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Patients Report */}
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-[var(--dark-slate)]">
                <Users className="mr-2 w-5 h-5" />
                Patients Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Export complete patient database with demographics and medical history
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{getTotalPatients()} patients</Badge>
                <Button 
                  onClick={exportPatientsReport}
                  size="sm"
                  className="bg-[var(--medical-blue)] hover:bg-blue-700"
                >
                  <FileDown className="mr-2 w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Visits Report */}
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-[var(--dark-slate)]">
                <Calendar className="mr-2 w-5 h-5" />
                Visits Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Export all appointment records with treatments and charges
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{getTotalVisits()} visits</Badge>
                <Button 
                  onClick={exportVisitsReport}
                  size="sm"
                  className="bg-[var(--accent-purple)] hover:bg-purple-700"
                >
                  <FileDown className="mr-2 w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments Report */}
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-[var(--dark-slate)]">
                <DollarSign className="mr-2 w-5 h-5" />
                Payments Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Export financial transactions and payment history
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{(payments || []).length} payments</Badge>
                <Button 
                  onClick={exportPaymentsReport}
                  size="sm"
                  className="bg-[var(--health-green)] hover:bg-emerald-700"
                >
                  <FileDown className="mr-2 w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Report */}
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-[var(--dark-slate)]">
                <Package className="mr-2 w-5 h-5" />
                Inventory Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Export equipment and supplies inventory with stock levels
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{(inventory || []).length} items</Badge>
                <Button 
                  onClick={exportInventoryReport}
                  size="sm"
                  className="bg-[var(--warning-amber)] hover:bg-orange-600"
                >
                  <FileDown className="mr-2 w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Financial Report */}
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-[var(--dark-slate)]">
                <TrendingUp className="mr-2 w-5 h-5" />
                Financial Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Export detailed financial analysis and revenue breakdown
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">₹{getTotalRevenue().toLocaleString()}</Badge>
                <Button 
                  onClick={exportFinancialReport}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <FileDown className="mr-2 w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Complete Report */}
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-[var(--dark-slate)]">
                <FileDown className="mr-2 w-5 h-5" />
                Complete Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Export all clinic data in a single comprehensive Excel file
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">All data</Badge>
                <Button 
                  onClick={exportAllData}
                  size="sm"
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                >
                  <FileDown className="mr-2 w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
