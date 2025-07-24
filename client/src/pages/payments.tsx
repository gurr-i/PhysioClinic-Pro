import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentForm from "@/components/payments/payment-form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Payments() {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  const { data: stats } = useQuery<{
    monthlyRevenue?: number;
    outstandingBalance?: number;
    [key: string]: any;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedPayment(null);
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'advance':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-yellow-100 text-yellow-800';
      case 'card':
        return 'bg-purple-100 text-purple-800';
      case 'transfer':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark-slate)]">Payment Management</h1>
          <p className="text-sm text-muted-foreground">Track payments and outstanding balances</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[var(--health-green)] to-emerald-600 hover:shadow-lg transition-all"
              onClick={() => setSelectedPayment(null)}
            >
              <Plus className="mr-2 w-4 h-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedPayment ? "Edit Payment" : "Record New Payment"}
              </DialogTitle>
            </DialogHeader>
            <PaymentForm 
              payment={selectedPayment} 
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </header>

      <div className="p-6">
        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">
                    ₹{stats?.monthlyRevenue?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-[var(--health-green)]">+8% from last month</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Outstanding Balance</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">
                    ₹{stats?.outstandingBalance?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-destructive">Needs attention</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--warning-amber)] to-orange-500 flex items-center justify-center">
                  <AlertCircle className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover-liquid liquid-gradient border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Collection Rate</p>
                  <p className="text-3xl font-bold text-[var(--dark-slate)]">0%</p>
                  <p className="text-sm text-[var(--health-green)]">Above target</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-purple-600 flex items-center justify-center">
                  <TrendingUp className="text-white w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="glass-effect border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--dark-slate)]">
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/30">
                    <TableHead className="px-6 py-4">Patient</TableHead>
                    <TableHead className="px-6 py-4">Amount</TableHead>
                    <TableHead className="px-6 py-4">Type</TableHead>
                    <TableHead className="px-6 py-4">Method</TableHead>
                    <TableHead className="px-6 py-4">Date</TableHead>
                    <TableHead className="px-6 py-4">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
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
                          <Skeleton className="h-6 w-12" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (payments || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No payments recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    (payments || []).map((payment: any) => (
                      <TableRow 
                        key={payment.id} 
                        className="hover:bg-card/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsFormOpen(true);
                        }}
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
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
                          <Badge className={getPaymentTypeColor(payment.paymentType)}>
                            {payment.paymentType.charAt(0).toUpperCase() + payment.paymentType.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
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
