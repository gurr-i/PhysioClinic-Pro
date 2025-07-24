import { useQuery } from "@tanstack/react-query";
import { User, Phone, Mail, MapPin, Calendar, FileText, CreditCard, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Patient } from "@shared/schema";

interface PatientDetailViewProps {
  patient: Patient;
}

export default function PatientDetailView({ patient }: PatientDetailViewProps) {
  // Fetch patient's visits
  const { data: visits, isLoading: visitsLoading } = useQuery<any[]>({
    queryKey: [`/api/patients/${patient.id}/visits`],
  });

  // Fetch patient's payments
  const { data: payments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: [`/api/patients/${patient.id}/payments`],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    return `₹${parseFloat(amount.toString()).toLocaleString()}`;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Patient Basic Info */}
      <Card className="glass-effect border-border/50">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--medical-blue)] to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {patient.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <CardTitle className="text-xl text-[var(--dark-slate)]">{patient.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Patient ID: {patient.id}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Age & Gender</p>
                <p className="font-medium text-[var(--dark-slate)]">{patient.age} years, {patient.gender}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-[var(--dark-slate)]">{patient.phone}</p>
              </div>
            </div>
            
            {patient.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-[var(--dark-slate)]">{patient.email}</p>
                </div>
              </div>
            )}
            
            {patient.address && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-[var(--dark-slate)]">{patient.address}</p>
                </div>
              </div>
            )}
          </div>
          
          {patient.emergencyContact && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Emergency Contact</p>
              <p className="font-medium text-[var(--dark-slate)]">{patient.emergencyContact}</p>
            </div>
          )}
          
          {patient.medicalHistory && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Medical History</p>
              <Badge variant="secondary" className="bg-[var(--medical-blue)]/20 text-[var(--medical-blue)]">
                {patient.medicalHistory}
              </Badge>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Account Balance</p>
              <p className={`font-bold ${parseFloat(patient.balance?.toString() || '0') >= 0 
                ? 'text-[var(--health-green)]' 
                : 'text-destructive'}`}>
                {formatCurrency(patient.balance?.toString() || '0')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Visits */}
      <Card className="glass-effect border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Visits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visitsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : visits && visits.length > 0 ? (
            <div className="space-y-3">
              {visits.slice(0, 5).map((visit: any) => (
                <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg bg-card/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-[var(--medical-blue)]/20 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[var(--medical-blue)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--dark-slate)]">{visit.treatmentProvided}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(visit.visitDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--dark-slate)]">{formatCurrency(visit.charges)}</p>
                    <p className="text-xs text-muted-foreground">{visit.duration} min</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No visits recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="glass-effect border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Recent Payments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-card/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-[var(--health-green)]/20 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-[var(--health-green)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--dark-slate)]">
                        {payment.paymentType === 'advance' ? 'Advance Payment' : 'Payment'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--health-green)]">
                      +{formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No payments recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
