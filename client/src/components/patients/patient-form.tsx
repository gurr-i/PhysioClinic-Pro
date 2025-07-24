import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertPatientSchema, type Patient, type InsertPatient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingButton } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { useFormValidation, useAutoSave } from "@/hooks/use-form-validation";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, Clock } from "lucide-react";

interface PatientFormProps {
  patient?: Patient | null;
  onSuccess: () => void;
  enableAutoSave?: boolean;
}

export default function PatientForm({ patient, onSuccess, enableAutoSave = false }: PatientFormProps) {
  const { toast } = useToast();
  const isEditing = !!patient;

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      name: patient?.name || "",
      age: patient?.age || 0,
      gender: patient?.gender || "",
      phone: patient?.phone || "",
      email: patient?.email || "",
      address: patient?.address || "",
      medicalHistory: patient?.medicalHistory || "",
      emergencyContact: patient?.emergencyContact || "",
    },
  });

  // Watch form values for auto-save
  const formValues = form.watch();

  // Auto-save functionality for editing
  const { isSaving, lastSaved, hasUnsavedChanges } = useAutoSave(
    formValues,
    async (values) => {
      if (isEditing && patient) {
        await apiRequest("PUT", `/api/patients/${patient.id}`, values);
        queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      }
    },
    {
      enabled: enableAutoSave && isEditing,
      delay: 2000,
      skipInitial: true,
    }
  );

  const createPatientMutation = useMutation({
    mutationFn: (data: InsertPatient) => apiRequest("POST", "/api/patients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create patient",
        variant: "destructive",
      });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: (data: InsertPatient) => apiRequest("PUT", `/api/patients/${patient!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPatient) => {
    if (isEditing) {
      updatePatientMutation.mutate(data);
    } else {
      createPatientMutation.mutate(data);
    }
  };

  const isPending = createPatientMutation.isPending || updatePatientMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Auto-save status */}
        {enableAutoSave && isEditing && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Unsaved changes</span>
                </>
              ) : lastSaved ? (
                <>
                  <Save className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </>
              ) : null}
            </div>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs">
                Auto-save enabled
              </Badge>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter patient's full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter age"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter patient's address" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medicalHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical History</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter relevant medical history" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact</FormLabel>
              <FormControl>
                <Input placeholder="Enter emergency contact details" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            isLoading={isPending}
            loadingText={isEditing ? "Updating..." : "Creating..."}
            className="bg-gradient-to-r from-[var(--medical-blue)] to-blue-600"
          >
            {isEditing ? "Update Patient" : "Create Patient"}
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
