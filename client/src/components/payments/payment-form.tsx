import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertPaymentSchema, type Payment, type InsertPayment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";


interface PaymentFormProps {
  payment?: any | null;
  onSuccess: () => void;
}

export default function PaymentForm({ payment, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const isEditing = !!payment;
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  useEffect(() => {
    if (Array.isArray(patients)) {
      if (searchTerm.trim() === "") {
        setFilteredPatients(patients);
      } else {
        const filtered = patients.filter((patient: any) => 
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          patient.phone.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPatients(filtered);
      }
    }
  }, [patients, searchTerm]);

  const { data: visits } = useQuery({
    queryKey: ["/api/visits"],
  });

  const form = useForm({
    resolver: zodResolver(insertPaymentSchema),
    defaultValues: {
      patientId: payment?.patientId || "",
      visitId: payment?.visitId || undefined,
      amount: payment?.amount || "0",
      paymentType: payment?.paymentType || "payment",
      paymentMethod: payment?.paymentMethod || "cash",
      paymentDate: payment?.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      notes: payment?.notes || "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: InsertPayment) => apiRequest("POST", "/api/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (data: InsertPayment) => apiRequest("PUT", `/api/payments/${payment!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    },
  });

  const watchedPatientId = form.watch("patientId");
  const patientVisits = Array.isArray(visits) ? visits.filter((visit: any) => visit.patientId === watchedPatientId) : [];
  

  const onSubmit = (data: any) => {
    const paymentData = {
      ...data,
      patientId: parseInt(data.patientId),
      amount: data.amount.toString(),
      paymentDate: data.paymentDate,
      visitId: data.visitId && data.visitId !== "none" ? parseInt(data.visitId) : undefined,
    };

    if (isEditing) {
      updatePaymentMutation.mutate(paymentData);
    } else {
      createPaymentMutation.mutate(paymentData);
    }
  };

  const isPending = createPaymentMutation.isPending || updatePaymentMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search patient by name or phone"
                  className="pl-10 bg-background/80 backdrop-blur-sm border-border focus-visible:ring-ring"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="patient-search"
                />
              </div>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString() || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.isArray(filteredPatients) ? filteredPatients.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name} - {patient.phone}
                    </SelectItem>
                  )) : []}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Visit (Optional)</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} defaultValue={field.value?.toString() || "none"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a visit (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No specific visit</SelectItem>
                  {patientVisits.map((visit: any) => (
                    <SelectItem key={visit.id} value={visit.id.toString()}>
                      {new Date(visit.visitDate).toLocaleDateString()} - {visit.treatmentProvided} (₹{parseFloat(visit.charges).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Date</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="advance">Advance Payment</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
          

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about the payment" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
            className="bg-gradient-to-r from-[var(--health-green)] to-emerald-600"
          >
            {isPending ? "Saving..." : isEditing ? "Update Payment" : "Record Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}