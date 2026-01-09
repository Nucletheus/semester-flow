import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { DeadlineTable } from "@/components/DeadlineTable";
import { BulkAddDialog } from "@/components/BulkAddDialog";
import { SemesterSettings } from "@/components/SemesterSettings";
import { useSemesters } from "@/hooks/useSemesters";
import { useAssignments, Assignment } from "@/hooks/useAssignments";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Deadlines() {
  const { activeSemester, isLoading: semestersLoading } = useSemesters();
  const { assignments, createAssignment, updateAssignment, deleteAssignment } = useAssignments(
    activeSemester?.id
  );

  const [showSemesterSettings, setShowSemesterSettings] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (values: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">) => {
    createAssignment.mutate(values);
  };

  const handleUpdate = (id: string, updates: Partial<Assignment>) => {
    updateAssignment.mutate({ id, ...updates });
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteAssignment.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenSemesterSettings={() => setShowSemesterSettings(true)} />

      <main className="container py-6 md:py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">Deadlines</h2>
              {activeSemester && (
                <Badge variant="secondary" className="text-xs">
                  {activeSemester.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all your assignments in one place
            </p>
          </div>

          {activeSemester && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBulkAdd(true)} className="gap-2">
                <Layers className="w-4 h-4" />
                Bulk Add
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {!activeSemester && !semestersLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Semester Selected</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create a semester first to start tracking your deadlines
            </p>
            <Button onClick={() => setShowSemesterSettings(true)}>
              Create Semester
            </Button>
          </div>
        ) : (
          <DeadlineTable
            assignments={assignments}
            semesterId={activeSemester?.id || ""}
            onUpdate={handleUpdate}
            onDelete={setDeleteId}
            onCreate={handleCreate}
          />
        )}
      </main>

      {/* Dialogs */}
      <SemesterSettings
        open={showSemesterSettings}
        onOpenChange={setShowSemesterSettings}
      />

      {activeSemester && (
        <BulkAddDialog
          open={showBulkAdd}
          onOpenChange={setShowBulkAdd}
          semesterId={activeSemester.id}
          onCreate={handleCreate}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
