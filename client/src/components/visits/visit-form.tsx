import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertVisitSchema, type Visit, type InsertVisit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface VisitFormProps {
  visit?: any | null;
  onSuccess: () => void;
}

export default function VisitForm({ visit, onSuccess }: VisitFormProps) {
  const { toast } = useToast();
  const isEditing = !!visit;
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

  const form = useForm({
    resolver: zodResolver(insertVisitSchema),
    defaultValues: {
      patientId: visit?.patientId || "",
      visitDate: visit?.visitDate ? new Date(visit.visitDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      treatmentProvided: visit?.treatmentProvided || "",
      duration: visit?.duration || 60,
      notes: visit?.notes || "",
      charges: visit?.charges || "0",
    },
  });

  const createVisitMutation = useMutation({
    mutationFn: (data: InsertVisit) => apiRequest("POST", "/api/visits", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Visit scheduled successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule visit",
        variant: "destructive",
      });
    },
  });

  const updateVisitMutation = useMutation({
    mutationFn: (data: InsertVisit) => apiRequest("PUT", `/api/visits/${visit!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Visit updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update visit",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const visitData = {
      ...data,
      patientId: parseInt(data.patientId),
      visitDate: data.visitDate,
      duration: parseInt(data.duration),
      charges: data.charges.toString(),
    };

    if (isEditing) {
      updateVisitMutation.mutate(visitData);
    } else {
      createVisitMutation.mutate(visitData);
    }
  };

  const isPending = createVisitMutation.isPending || updateVisitMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search patient by name or phone"
                    className="mb-2 pl-10 bg-background/80 backdrop-blur-sm border-border focus-visible:ring-ring"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    id="patient-search"
                  />
                </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="visitDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time</FormLabel>
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

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="60"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="treatmentProvided"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treatment Provided</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lower back therapy, Knee rehabilitation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="charges"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Charges (₹)</FormLabel>
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about the visit" {...field} />
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
            className="bg-gradient-to-r from-[var(--medical-blue)] to-blue-600"
          >
            {isPending ? "Saving..." : isEditing ? "Update Visit" : "Schedule Visit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
