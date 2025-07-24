
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Upload,
  Database,
  Trash2,
  Calendar,
  HardDrive,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DatabaseBackup() {
  const [backupName, setBackupName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: backups, isLoading } = useQuery<any[]>({
    queryKey: ["/api/database/backups"],
  });

  const createBackupMutation = useMutation({
    mutationFn: async (filename?: string) => {
      const response = await fetch("/api/database/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!response.ok) throw new Error("Failed to create backup");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/backups"] });
      toast({
        title: "Success",
        description: "Database backup created successfully",
      });
      setBackupName("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await fetch("/api/database/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!response.ok) throw new Error("Failed to restore backup");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Database restored successfully",
      });
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore backup",
        variant: "destructive",
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await fetch(`/api/database/backups/${filename}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete backup");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/backups"] });
      toast({
        title: "Success",
        description: "Backup deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete backup",
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const downloadBackup = (filename: string) => {
    window.open(`/api/database/backups/${filename}/download`, '_blank');
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark-slate)]">
            Database Backup & Restore
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your clinic database backups
          </p>
        </div>
      </header>

      <div className="p-6">
        {/* Create Backup Section */}
        <Card className="glass-effect border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-[var(--dark-slate)]">
              <Database className="mr-2 w-5 h-5" />
              Create New Backup
            </CardTitle>
            <CardDescription>
              Create a complete backup of your clinic database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Backup name (optional)"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => createBackupMutation.mutate(backupName || undefined)}
                disabled={createBackupMutation.isPending}
                className="bg-[var(--medical-blue)] hover:bg-blue-700"
              >
                {createBackupMutation.isPending ? "Creating..." : "Create Backup"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup List */}
        <Card className="glass-effect border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-[var(--dark-slate)]">
              <HardDrive className="mr-2 w-5 h-5" />
              Available Backups
            </CardTitle>
            <CardDescription>
              Manage your existing database backups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading backups...</div>
            ) : !Array.isArray(backups) || backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="mx-auto w-12 h-12 mb-4 opacity-50" />
                <p>No backups found</p>
                <p className="text-sm">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(backups) && backups.map((backup: any) => (
                  <div
                    key={backup.filename}
                    className="flex items-center justify-between p-4 rounded-xl bg-card/50 hover:bg-card/70 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--dark-slate)]">
                        {backup.filename}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="mr-1 w-4 h-4" />
                          {new Date(backup.created).toLocaleString()}
                        </span>
                        <Badge variant="secondary">
                          {formatFileSize(backup.size)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup.filename)}
                      >
                        <Download className="mr-2 w-4 h-4" />
                        Download
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[var(--health-green)] text-[var(--health-green)] hover:bg-[var(--health-green)] hover:text-white"
                          >
                            <Upload className="mr-2 w-4 h-4" />
                            Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertTriangle className="mr-2 w-5 h-5 text-amber-500" />
                              Restore Database
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will replace all current data with the backup data. 
                              This action cannot be undone. Are you sure you want to continue?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => restoreBackupMutation.mutate(backup.filename)}
                              className="bg-[var(--health-green)] hover:bg-green-700"
                            >
                              Restore
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this backup? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBackupMutation.mutate(backup.filename)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
