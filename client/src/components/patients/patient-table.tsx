import { useState } from "react";
import { Eye, Edit2, Trash2, Phone, Mail, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Patient } from "@shared/schema";

interface PatientTableProps {
  patients: Patient[];
  isLoading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (id: number) => void;
  onView?: (patient: Patient) => void;
  searchTerm?: string;
}

export default function PatientTable({ 
  patients, 
  isLoading, 
  onEdit, 
  onDelete, 
  onView,
  searchTerm = "" 
}: PatientTableProps) {
  const filteredPatients = patients?.filter((patient: Patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  ) || [];

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/30">
              <TableHead className="px-6 py-4">Patient</TableHead>
              <TableHead className="px-6 py-4">Contact</TableHead>
              <TableHead className="px-6 py-4">Age/Gender</TableHead>
              <TableHead className="px-6 py-4">Medical History</TableHead>
              <TableHead className="px-6 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
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
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (filteredPatients.length === 0) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/30">
              <TableHead className="px-6 py-4">Patient</TableHead>
              <TableHead className="px-6 py-4">Contact</TableHead>
              <TableHead className="px-6 py-4">Age/Gender</TableHead>
              <TableHead className="px-6 py-4">Medical History</TableHead>
              <TableHead className="px-6 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                {searchTerm ? "No patients found matching your search" : "No patients found"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-card/30">
            <TableHead className="px-6 py-4 text-left text-sm font-semibold text-[var(--dark-slate)]">
              Patient
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-sm font-semibold text-[var(--dark-slate)]">
              Contact
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-sm font-semibold text-[var(--dark-slate)]">
              Age/Gender
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-sm font-semibold text-[var(--dark-slate)]">
              Medical History
            </TableHead>
            <TableHead className="px-6 py-4 text-left text-sm font-semibold text-[var(--dark-slate)]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200/50">
          {filteredPatients.map((patient: Patient) => (
            <TableRow 
              key={patient.id} 
              className="hover:bg-card/30 transition-colors"
            >
              <TableCell className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--medical-blue)] to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {patient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--dark-slate)]">
                      {patient.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {patient.id}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-[var(--dark-slate)]">
                    <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                    {patient.phone}
                  </div>
                  {patient.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="w-3 h-3 mr-2" />
                      {patient.email}
                    </div>
                  )}
                  {!patient.email && (
                    <p className="text-sm text-muted-foreground">No email</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex items-center text-sm text-[var(--dark-slate)]">
                  <User className="w-3 h-3 mr-2 text-muted-foreground" />
                  {patient.age}, {patient.gender}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                {patient.medicalHistory ? (
                  <Badge 
                    variant="secondary" 
                    className="bg-[var(--medical-blue)]/20 text-[var(--medical-blue)] hover:bg-[var(--medical-blue)]/30"
                  >
                    {patient.medicalHistory.length > 20 
                      ? `${patient.medicalHistory.substring(0, 20)}...` 
                      : patient.medicalHistory}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex space-x-2">
                  {onView && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onView(patient)}
                      className="p-2 text-[var(--medical-blue)] hover:bg-[var(--medical-blue)]/10 rounded-lg transition-colors"
                      title="View patient details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(patient)}
                    className="p-2 text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10 rounded-lg transition-colors"
                    title="Edit patient"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${patient.name}? This action cannot be undone.`)) {
                        onDelete(patient.id);
                      }
                    }}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete patient"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
