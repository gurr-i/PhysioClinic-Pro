import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Eye, Edit2, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressiveLoading, TableSkeleton, EmptyState, LoadingButton } from "@/components/ui/loading";
import { EnhancedSearch } from "@/components/ui/enhanced-search";
import { useAdvancedFilter, useSearchHistory } from "@/hooks/use-debounced-search";
import PatientForm from "@/components/patients/patient-form";
import PatientDetailView from "@/components/patients/patient-detail-view";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@shared/schema";

export default function Patients() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [filterCriteria, setFilterCriteria] = useState({
    condition: '',
    paymentStatus: '',
  });
  const { toast } = useToast();
  const { searchHistory, addToHistory } = useSearchHistory();

  const { data: patients, isLoading, error, refetch } = useQuery<Patient[]>({
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

  // Enhanced search and filtering
  const {
    searchTerm,
    setSearchTerm,
    filteredItems: filteredPatients,
    isSearching,
    highlightMatch,
    isEmpty: isSearchEmpty,
  } = useAdvancedFilter(
    patients || [],
    ['name', 'email', 'phone', 'medicalHistory'],
    filterCriteria,
    { delay: 300, minLength: 1 }
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
              <EnhancedSearch
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={(term) => addToHistory(term)}
                placeholder="Search patients by name, email, phone..."
                isLoading={isSearching}
                recentSearches={searchHistory}
                popularSearches={['back pain', 'knee injury', 'shoulder pain']}
                className="bg-background/80 backdrop-blur-sm border-border"
                showSuggestions={true}
              />
              <Select
                value={filterCriteria.condition || "all"}
                onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, condition: value === "all" ? "" : value }))}
              >
                <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border">
                  <SelectValue placeholder="All Conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="back pain">Back Pain</SelectItem>
                  <SelectItem value="knee">Knee Issues</SelectItem>
                  <SelectItem value="shoulder">Shoulder Issues</SelectItem>
                  <SelectItem value="neck">Neck Pain</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterCriteria.paymentStatus || "all"}
                onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, paymentStatus: value === "all" ? "" : value }))}
              >
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
            <ProgressiveLoading
              isLoading={isLoading}
              error={error as Error | null}
              isEmpty={!filteredPatients || filteredPatients.length === 0}
              onRetry={() => refetch()}
              loadingSkeleton={
                <div className="p-6">
                  <TableSkeleton rows={5} columns={6} />
                </div>
              }
              emptyState={
                <EmptyState
                  title={
                    isSearchEmpty
                      ? "No patients found"
                      : searchTerm
                        ? "No matching patients"
                        : "No patients yet"
                  }
                  message={
                    isSearchEmpty
                      ? `No patients match "${searchTerm}". Try a different search term or check your filters.`
                      : searchTerm
                        ? "Try adjusting your search criteria or filters."
                        : "Get started by adding your first patient to the system."
                  }
                  icon={<Users className="w-6 h-6 text-gray-400" />}
                  action={
                    !searchTerm && !isSearchEmpty ? {
                      label: "Add First Patient",
                      onClick: () => {
                        setSelectedPatient(null);
                        setIsFormOpen(true);
                      }
                    } : searchTerm ? {
                      label: "Clear Search",
                      onClick: () => {
                        setSearchTerm('');
                        setFilterCriteria({ condition: '', paymentStatus: '' });
                      }
                    } : undefined
                  }
                />
              }
            >
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
                    {filteredPatients.map((patient: Patient) => (
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
                            <LoadingButton
                              size="sm"
                              variant="ghost"
                              isLoading={deletePatientMutation.isPending}
                              onClick={() => handleDelete(patient.id)}
                              className="p-2 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </LoadingButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ProgressiveLoading>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}