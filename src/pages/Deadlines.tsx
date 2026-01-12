import { useState, useMemo } from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { DataTable } from "@/components/ui/data-table"; // Updated import
import { columns, AssignmentUI } from "@/components/deadlines/columns"; // Create columns definition
import { BulkAddDialog } from "@/components/BulkAddDialog";
import { AssignmentForm } from "@/components/AssignmentForm";
import { SemesterSettings } from "@/components/SemesterSettings";
import { useSemesters } from "@/hooks/useSemesters";
import { useAssignments, Assignment } from "@/hooks/useAssignments";
import { Badge } from "@/components/ui/badge";

export default function Deadlines() {
  const { activeSemester, isLoading: semestersLoading } = useSemesters();
  const { assignments, createAssignment, createAssignments, updateAssignment, deleteAssignment } = useAssignments(
    activeSemester?.id
  );

  const [showSemesterSettings, setShowSemesterSettings] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!activeSemester) return;
    try {
      const newAssignment = await createAssignment.mutateAsync({
        semester_id: activeSemester.id,
        class_name: "",
        assignment_name: "",
        type: "Quiz", // Default
        due_date: new Date().toISOString(),
        color: "#000000",
        status: "not started",
      });
      if (newAssignment) {
        setLastCreatedId(newAssignment.id);
      }
    } catch (error) {
      console.error("Failed to create assignment", error);
    }
  };

  const updateData = (id: string, field: keyof Assignment, value: any) => {
    // If user interacts with a row, it's no longer "just created", so we can clear the focus flag if we want, 
    // or just leave it. Leaving it is fine as autoFocus only runs on mount/update if we are careful.
    updateAssignment.mutate({ id, [field]: value });
  };

  const deleteData = (id: string) => {
    deleteAssignment.mutate(id);
  };

  const classOptions = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.class_name && !map.has(a.class_name)) {
        map.set(a.class_name, { label: a.class_name, value: a.class_name, color: a.color });
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  // Cast assignments to include status for UI typing
  const data = assignments as AssignmentUI[];

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

          {/* ... existing header content ... */}
          {activeSemester && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBulkAdd(true)} className="gap-2">
                <Layers className="w-4 h-4" />
                Bulk Add
              </Button>
              <Button onClick={() => setShowAssignmentForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Deadline
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {!activeSemester && !semestersLoading ? (
          // ... empty state ...
          <div className="text-center py-16">
            {/* ... */}
            <Button onClick={() => setShowSemesterSettings(true)}>Create Semester</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={columns}
              data={data}
              meta={{
                updateData,
                deleteData,
                classOptions,
                lastCreatedId,
                onCreateRow: handleCreate
              }}
            />
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={handleCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <SemesterSettings
        open={showSemesterSettings}
        onOpenChange={setShowSemesterSettings}
      />

      {activeSemester && (
        <>
          <BulkAddDialog
            open={showBulkAdd}
            onOpenChange={setShowBulkAdd}
            semesterId={activeSemester.id}
            onCreate={(values) => createAssignments.mutate(values)}
            classOptions={classOptions}
          />
          <AssignmentForm
            open={showAssignmentForm}
            onOpenChange={setShowAssignmentForm}
            semesterId={activeSemester.id}
            onSubmit={(values) => createAssignment.mutate(values)}
            classOptions={classOptions}
          />
        </>
      )}
    </div>
  );
}
