import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, User, CreditCard, AlertCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaymentForm from "@/components/payments/payment-form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdvancePayments() {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: patients, isLoading: patientsLoading } = useQuery<any[]>({
    queryKey: ["/api/patients"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedPayment(null);
  };

  // Calculate advance balances for each patient
  const getPatientAdvanceBalance = (patientId: number) => {
    if (!payments) return 0;

    const patientPayments = Array.isArray(payments) ? payments.filter((payment: any) => payment.patientId === patientId) : [];
    const advances = patientPayments
      .filter((payment: any) => payment.paymentType === 'advance')
      .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0);

    return advances;
  };

  // Get all advance payments
  const advancePayments = Array.isArray(payments) ? payments.filter((payment: any) => payment.paymentType === 'advance') : [];

  // Filter patients based on search term
  const filteredPatients = Array.isArray(patients) ? patients.filter((patient: any) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  ) : [];

  // Filter patients with positive balances (credit)
  const patientsWithAdvances = Array.isArray(patients) ? patients.filter((patient: any) => {
    const balance = parseFloat(patient.balance?.toString() || '0');
    return balance > 0;
  }) : [];

  const isLoading = patientsLoading || paymentsLoading;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark-slate)]">Advance Payments</h1>
          <p className="text-sm text-muted-foreground">Track advance payments and patient balances</p>
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
                className="bg-gradient-to-r from-[var(--health-green)] to-emerald-600 hover:shadow-lg transition-all"
                onClick={() => setSelectedPayment(null)}
              >
                <Plus className="mr-2 w-4 h-4" />
                Record Advance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Advance Payment</DialogTitle>
              </DialogHeader>
              <PaymentForm 
                payment={{ paymentType: 'advance' }} 
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Advance Balances Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-effect border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Advance Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--health-green)]">
                ₹{advancePayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients with Advances</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--dark-slate)]">
                {patientsWithAdvances.length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Advance Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--dark-slate)]">
                {advancePayments.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Advance Balances */}
        <Card className="glass-effect border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
              Patient Advance Balances
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
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : patientsWithAdvances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="mx-auto w-12 h-12 mb-4 opacity-50" />
                <p>No patients with advance payments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patientsWithAdvances.map((patient: any) => {
                  const advanceBalance = getPatientAdvanceBalance(patient.id);
                  return (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-card/50 hover:bg-card/70 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--health-green)] to-emerald-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {patient.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--dark-slate)]">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {patient.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          ₹{advanceBalance.toLocaleString()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Advance Balance
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Advance Payments */}
        <Card className="glass-effect border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
              Recent Advance Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-[var(--dark-slate)] font-semibold">Patient</TableHead>
                    <TableHead className="text-[var(--dark-slate)] font-semibold">Amount</TableHead>
                    <TableHead className="text-[var(--dark-slate)] font-semibold">Payment Method</TableHead>
                    <TableHead className="text-[var(--dark-slate)] font-semibold">Date</TableHead>
                    <TableHead className="text-[var(--dark-slate)] font-semibold">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i} className="border-border/50">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : advancePayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No advance payments recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    advancePayments
                      .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                      .slice(0, 10)
                      .map((payment: any) => (
                        <TableRow 
                          key={payment.id} 
                          className="hover:bg-card/30 transition-colors cursor-pointer border-border/50"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsFormOpen(true);
                          }}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--health-green)] to-emerald-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {payment.patient.name.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium text-[var(--dark-slate)]">
                                {payment.patient.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="font-semibold text-[var(--health-green)]">
                              ₹{parseFloat(payment.amount).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className="bg-purple-100 text-purple-800">
                              {payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-[var(--dark-slate)]">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                            {payment.notes || "—"}
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