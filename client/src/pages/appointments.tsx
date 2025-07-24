import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, MapPin, Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import VisitForm from "@/components/visits/visit-form";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Visit } from "@shared/schema";

export default function Appointments() {
  const { toast } = useToast();
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<any | null>(null);

  const { data: visits, isLoading } = useQuery<any[]>({
    queryKey: ["/api/visits"],
  });

  const deleteVisitMutation = useMutation({
    mutationFn: async (visitId: number) => {
      return await apiRequest("DELETE", `/api/visits/${visitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setVisitToDelete(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to delete appointment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedVisit(null);
  };

  const getStatusColor = (visitDate: string) => {
    const now = new Date();
    const visit = new Date(visitDate);
    
    if (visit.toDateString() === now.toDateString()) {
      return visit.getTime() < now.getTime() ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
    }
    
    return visit.getTime() < now.getTime() ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const getStatusText = (visitDate: string) => {
    const now = new Date();
    const visit = new Date(visitDate);
    
    if (visit.toDateString() === now.toDateString()) {
      return visit.getTime() < now.getTime() ? "Completed" : "Today";
    }
    
    return visit.getTime() < now.getTime() ? "Completed" : "Scheduled";
  };

  // Filter visits based on search term
  const filteredVisits = Array.isArray(visits) ? visits.filter((visit: any) =>
    visit?.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit?.treatmentProvided?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Today's visits
  const todaysVisits = filteredVisits.filter((visit: any) => {
    const today = new Date();
    const visitDate = new Date(visit.visitDate);
    return visitDate.toDateString() === today.toDateString();
  });

  const handleDeleteClick = (e: React.MouseEvent, visit: any) => {
    e.stopPropagation(); // Prevent opening the edit form
    setVisitToDelete(visit);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (visitToDelete) {
      deleteVisitMutation.mutate(visitToDelete.id);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark-slate)]">Appointments</h1>
          <p className="text-sm text-muted-foreground">Manage patient visits and treatments</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 rounded-xl bg-background/80 backdrop-blur-sm border-border focus-visible:ring-ring"
            />
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-[var(--medical-blue)] to-blue-600 hover:shadow-lg transition-all"
                onClick={() => setSelectedVisit(null)}
              >
                <Plus className="mr-2 w-4 h-4" />
                Schedule Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedVisit ? "Edit Visit" : "Schedule New Visit"}
                </DialogTitle>
              </DialogHeader>
              <VisitForm 
                visit={selectedVisit} 
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6">
        {/* Today's Appointments */}
        <Card className="glass-effect border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold text-[var(--dark-slate)]">
              <Calendar className="mr-2 w-5 h-5" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card/50">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todaysVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto w-12 h-12 mb-4 opacity-50" />
                <p>{searchTerm ? "No matching appointments found for today" : "No appointments scheduled for today"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysVisits.map((visit: any) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-card/50 hover:bg-card/70 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                        <User className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--dark-slate)]">
                          {visit.patient.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {visit.treatmentProvided}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Clock className="mr-1 w-3 h-3" />
                          {new Date(visit.visitDate).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                          <span className="mx-2">•</span>
                          <span>{visit.duration} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(visit.visitDate)}>
                          {getStatusText(visit.visitDate)}
                        </Badge>
                        <Badge className={visit.hasPayment ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                          {visit.hasPayment ? "Paid" : "Unpaid"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-[var(--dark-slate)] mt-1">
                        ₹{parseFloat(visit.charges).toLocaleString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 mt-1 ${
                          visit.hasPayment
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-500 hover:text-red-700 hover:bg-red-100"
                        }`}
                        onClick={(e) => visit.hasPayment ? e.preventDefault() : handleDeleteClick(e, visit)}
                        disabled={visit.hasPayment}
                        title={visit.hasPayment ? "Cannot delete appointment with payments" : "Delete appointment"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Appointments */}
        <Card className="glass-effect border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
              All Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card/50">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-6 w-16 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="mx-auto w-12 h-12 mb-4 opacity-50" />
                <p>{searchTerm ? "No matching appointments found" : "No appointments found"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVisits.map((visit: any) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedVisit(visit);
                      setIsFormOpen(true);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {visit.patient.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--dark-slate)]">
                          {visit.patient.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {visit.treatmentProvided}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Calendar className="mr-1 w-3 h-3" />
                          {new Date(visit.visitDate).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          <Clock className="mr-1 w-3 h-3" />
                          {new Date(visit.visitDate).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                          <span className="mx-2">•</span>
                          <span>{visit.duration} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex space-x-2 justify-end">
                        <Badge className={getStatusColor(visit.visitDate)}>
                          {getStatusText(visit.visitDate)}
                        </Badge>
                        <Badge className={visit.hasPayment ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                          {visit.hasPayment ? "Paid" : "Unpaid"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-[var(--dark-slate)] mt-1">
                        ₹{parseFloat(visit.charges).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {visitToDelete?.hasPayment ? (
                <div className="space-y-2">
                  <p className="text-destructive font-medium">Cannot delete this appointment!</p>
                  <p>This appointment has associated payments and cannot be deleted. You can only delete appointments that haven't been paid for yet.</p>
                </div>
              ) : (
                "Are you sure you want to delete this appointment? This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {visitToDelete?.hasPayment ? "Close" : "Cancel"}
            </Button>
            {!visitToDelete?.hasPayment && (
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteVisitMutation.isPending}
              >
                {deleteVisitMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}