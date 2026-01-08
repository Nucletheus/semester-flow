import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { WorkloadChart } from "@/components/WorkloadChart";
import { DeadlineList } from "@/components/DeadlineList";
import { AssignmentForm } from "@/components/AssignmentForm";
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

export default function Dashboard() {
  const { activeSemester, isLoading: semestersLoading } = useSemesters();
  const { assignments, createAssignment, updateAssignment, deleteAssignment } = useAssignments(
    activeSemester?.id
  );

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showSemesterSettings, setShowSemesterSettings] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAddAssignment = (values: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (editingAssignment) {
      updateAssignment.mutate({ id: editingAssignment.id, ...values });
    } else {
      createAssignment.mutate(values);
    }
    setEditingAssignment(null);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowAssignmentForm(true);
  };

  const handleDeleteAssignment = () => {
    if (deleteId) {
      deleteAssignment.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenSemesterSettings={() => setShowSemesterSettings(true)} />

      <main className="container py-6 md:py-8 space-y-6">
        {/* Semester Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">
                {activeSemester?.name || "No Semester Selected"}
              </h2>
              {activeSemester && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            {activeSemester && (
              <p className="text-sm text-muted-foreground mt-1">
                Track your academic workload and stay ahead of deadlines
              </p>
            )}
          </div>
          
          {activeSemester && (
            <Button onClick={() => setShowAssignmentForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Deadline
            </Button>
          )}
        </div>

        {!activeSemester && !semestersLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Get Started</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first semester to start tracking your academic workload
            </p>
            <Button onClick={() => setShowSemesterSettings(true)}>
              Create Semester
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Chart - Takes more space */}
            <div className="lg:col-span-3">
              <WorkloadChart assignments={assignments} semester={activeSemester} />
            </div>

            {/* Deadline List */}
            <div className="lg:col-span-2">
              <DeadlineList
                assignments={assignments}
                onEdit={handleEditAssignment}
                onDelete={setDeleteId}
              />
            </div>
          </div>
        )}
      </main>

      {/* Forms and Dialogs */}
      {activeSemester && (
        <AssignmentForm
          open={showAssignmentForm}
          onOpenChange={(open) => {
            setShowAssignmentForm(open);
            if (!open) setEditingAssignment(null);
          }}
          semesterId={activeSemester.id}
          assignment={editingAssignment}
          onSubmit={handleAddAssignment}
        />
      )}

      <SemesterSettings
        open={showSemesterSettings}
        onOpenChange={setShowSemesterSettings}
      />

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
              onClick={handleDeleteAssignment}
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
