import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { createPortal } from "react-dom";
import { Plus, Layers, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table"; // Updated import
import { columns, AssignmentUI } from "@/components/deadlines/columns"; // Create columns definition
import { BulkAddDialog } from "@/components/BulkAddDialog";
import { AssignmentForm } from "@/components/AssignmentForm";
import { SemesterSettings } from "@/components/SemesterSettings";
import { useSemesters } from "@/hooks/useSemesters";
import { useAssignments, Assignment } from "@/hooks/useAssignments";
import { getClassThemeColor, getClassThemeVar } from "@/lib/themeColors";
import { Badge } from "@/components/ui/badge";
import { SortingState } from "@tanstack/react-table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Deadlines() {
  const { activeSemester, isLoading: semestersLoading } = useSemesters();
  const { assignments, createAssignment, createAssignments, updateAssignment, deleteAssignment, deleteAssignments } = useAssignments(
    activeSemester?.id
  );

  const [showSemesterSettings, setShowSemesterSettings] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    return localStorage.getItem("deadlines-compact") === "true";
  });
  const [sorting, setSorting] = useState<SortingState>(() => {
    const saved = localStorage.getItem("deadlines-sorting");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("deadlines-sorting", JSON.stringify(sorting));
  }, [sorting]);

  useEffect(() => {
    localStorage.setItem("deadlines-compact", String(isCompact));
  }, [isCompact]);

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
      // No need to set lastCreatedId or timer anymore
    } catch (error) {
      console.error("Failed to create assignment", error);
    }
  };

  const uniqueClassNames = useMemo(() => {
    return [...new Set(assignments.map(a => a.class_name).filter(Boolean).map(n => n.trim()))].sort();
  }, [assignments]);

  const updateData = (id: string, field: keyof Assignment, value: any) => {
    updateAssignment.mutate({ id, [field]: value });
  };

  const deleteData = (id: string) => {
    deleteAssignment.mutate(id);
  };

  const handleDeleteSelected = () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    deleteAssignments.mutate(selectedIds, {
      onSuccess: () => {
        setRowSelection({});
      }
    });
  };

  const classOptions = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.class_name && !map.has(a.class_name)) {
        map.set(a.class_name, {
          label: a.class_name,
          value: a.class_name,
          color: getClassThemeColor(a.class_name, uniqueClassNames)
        });
      }
    });
    return Array.from(map.values());
  }, [assignments, uniqueClassNames]);

  // Cast assignments to include status for UI typing
  const data = assignments as AssignmentUI[];

  const tableData = useMemo(() => {
    return assignments.map(a => ({
      ...a,
      color: getClassThemeVar(a.class_name, uniqueClassNames),
    }));
  }, [assignments, uniqueClassNames]);

  return (
    <div className="min-h-screen bg-background">

      <main className="container px-4 py-4 md:py-8 space-y-6">
        {/* Content */}
        {!activeSemester && !semestersLoading ? (
          // ... empty state ...
          <div className="text-center py-16">
            {/* ... */}
            <Button onClick={() => setShowSemesterSettings(true)}>Create Timeline</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end items-center gap-2 px-1">
              <Label htmlFor="compact-mode" className="text-xs font-medium text-muted-foreground select-none">
                Compact Mode
              </Label>
              <Switch
                id="compact-mode"
                checked={isCompact}
                onCheckedChange={setIsCompact}
              />
            </div>
            <DataTable
              columns={columns}
              data={tableData}
              rowSelection={rowSelection}
              setRowSelection={setRowSelection}
              sorting={sorting}
              setSorting={setSorting}
              getRowId={(row) => row.id}
              isCompact={isCompact}
              meta={{
                updateData,
                deleteData,
                classOptions,
                onCreateRow: handleCreate,
                isCompact,
                semesterStart: activeSemester ? parseISO(activeSemester.start_date) : undefined,
                semesterEnd: activeSemester ? parseISO(activeSemester.end_date) : undefined
              }}
            />
          </div>
        )}
      </main>

      {/* Header Actions Portal */}
      {activeSemester && document.getElementById('header-actions') && createPortal(
        <div className="flex gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete ({Object.keys(rowSelection).length})</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Selected</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setShowBulkAdd(true)} className="gap-2">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk Add</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bulk Add Assignments</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={() => setShowAssignmentForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Deadline</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add New Deadline</TooltipContent>
          </Tooltip>
        </div>,
        document.getElementById('header-actions')!
      )}

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
