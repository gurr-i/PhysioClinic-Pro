import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Eye, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import PatientForm from "@/components/patients/patient-form";
import PatientDetailView from "@/components/patients/patient-detail-view";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@shared/schema";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  const deletePatientMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
    },
  });

  const filteredPatients = (patients || []).filter((patient: Patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const handleView = (patient: Patient) => {
    setViewingPatient(patient);
    setIsViewOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this patient?")) {
      deletePatientMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedPatient(null);
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark-slate)]">Patient Management</h1>
          <p className="text-sm text-muted-foreground">Manage patient profiles and records</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[var(--medical-blue)] to-blue-600 hover:shadow-lg transition-all"
              onClick={() => setSelectedPatient(null)}
            >
              <Plus className="mr-2 w-4 h-4" />
              Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedPatient ? "Edit Patient" : "Add New Patient"}
              </DialogTitle>
            </DialogHeader>
            <PatientForm 
              patient={selectedPatient} 
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>

        {/* Patient Detail View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Patient Details - {viewingPatient?.name}
              </DialogTitle>
            </DialogHeader>
            {viewingPatient && <PatientDetailView patient={viewingPatient} />}
          </DialogContent>
        </Dialog>
      </header>

      <div className="p-6">
        {/* Search and Filters */}
        <Card className="glass-effect border-border/50 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/80 backdrop-blur-sm border-border focus-visible:ring-ring"
                />
              </div>
              <Select>
                <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border">
                  <SelectValue placeholder="All Conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="back-pain">Back Pain</SelectItem>
                  <SelectItem value="knee-injury">Knee Injury</SelectItem>
                  <SelectItem value="shoulder-issues">Shoulder Issues</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="bg-card/70 backdrop-blur-sm">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-[var(--accent-purple)] text-white hover:bg-purple-700">
                <Filter className="mr-2 w-4 h-4" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card className="glass-effect border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/30">
                    <TableHead className="px-6 py-4">Patient</TableHead>
                    <TableHead className="px-6 py-4">Contact</TableHead>
                    <TableHead className="px-6 py-4">Age/Gender</TableHead>
                    <TableHead className="px-6 py-4">Medical History</TableHead>
                    <TableHead className="px-6 py-4 text-right">Account Balance</TableHead>
                    <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Skeleton className="w-8 h-8" />
                            <Skeleton className="w-8 h-8" />
                            <Skeleton className="w-8 h-8" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        {searchTerm ? "No patients found matching your search" : "No patients found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient: Patient) => (
                      <TableRow key={patient.id} className="hover:bg-card/30 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {patient.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-[var(--dark-slate)]">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <p className="text-sm text-[var(--dark-slate)]">{patient.phone}</p>
                          <p className="text-sm text-muted-foreground">{patient.email || "No email"}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-[var(--dark-slate)]">
                          {patient.age}, {patient.gender}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {patient.medicalHistory && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              {patient.medicalHistory.length > 20 
                                ? `${patient.medicalHistory.substring(0, 20)}...` 
                                : patient.medicalHistory}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-right">
                            {(() => {
                              const balance = parseFloat(patient.balance?.toString() || '0');
                              
                              if (balance > 0) {
                                return (
                                  <Badge className="bg-green-100 text-green-800">
                                    +₹{balance.toLocaleString()} Credit
                                  </Badge>
                                );
                              } else if (balance < 0) {
                                return (
                                  <Badge className="bg-red-100 text-red-800">
                                    -₹{Math.abs(balance).toLocaleString()} Due
                                  </Badge>
                                );
                              } else {
                                return (
                                  <span className="text-sm text-muted-foreground">₹0.00</span>
                                );
                              }
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(patient)}
                              className="p-2 text-primary hover:bg-primary/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(patient)}
                              className="p-2 text-[var(--accent-purple)] hover:bg-purple-100"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(patient.id)}
                              className="p-2 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}