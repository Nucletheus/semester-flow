
import { useState, useMemo } from "react";
import { Plus, ArrowRight, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { WorkloadChart } from "@/components/WorkloadChart";
import { AssignmentForm } from "@/components/AssignmentForm";
import { SemesterSettings } from "@/components/SemesterSettings";
import { useSemesters } from "@/hooks/useSemesters";
import { useAssignments, Assignment } from "@/hooks/useAssignments";
import { Badge } from "@/components/ui/badge";
import { BulkAddDialog } from "@/components/BulkAddDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, isPast, isToday } from "date-fns";

export default function Dashboard() {
  const { activeSemester, isLoading: semestersLoading } = useSemesters();
  const { assignments, createAssignment, createAssignments, updateAssignment, deleteAssignment, updateClassColor } = useAssignments(
    activeSemester?.id
  );

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showSemesterSettings, setShowSemesterSettings] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const handleAddAssignment = (values: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">) => {
    createAssignment.mutate(values);
  };

  // Get next 5 upcoming assignments
  const upcomingAssignments = assignments
    .filter((a) => !isPast(parseISO(a.due_date)) || isToday(parseISO(a.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const classOptions = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.class_name && !map.has(a.class_name)) {
        map.set(a.class_name, { label: a.class_name, value: a.class_name, color: a.color });
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenSemesterSettings={() => setShowSemesterSettings(true)} />

      <main className="container py-6 md:py-8 space-y-6">
        {activeSemester && (
          <div className="flex justify-end">
            <Button onClick={() => setShowBulkAdd(true)} size="sm" variant="outline" className="gap-1 shadow-sm mr-2">
              <Layers className="w-3.5 h-3.5" />
              Bulk Add
            </Button>
            <Button onClick={() => setShowAssignmentForm(true)} size="sm" className="gap-1 shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              Add Deadline
            </Button>
          </div>
        )}

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
          <div className="space-y-6">
            {/* Chart - Full width */}
            <WorkloadChart
              assignments={assignments}
              semester={activeSemester}
              onColorChange={(className, newColor) => updateClassColor.mutate({ className, newColor })}
            />

            {/* Quick Preview of Upcoming Deadlines */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3 pt-4 px-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                      Next 5
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link to="/deadlines" className="gap-1">
                      View All
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No upcoming deadlines. Time to relax! 🎉
                  </p>
                ) : (
                  <div className="divide-y divide-border/50">
                    {upcomingAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-2 px-4 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-1 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: assignment.color }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {assignment.assignment_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{assignment.class_name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right pl-4 flex-shrink-0">
                          <Badge variant={isToday(parseISO(assignment.due_date)) ? "destructive" : "outline"} className="text-[10px] font-normal px-1.5 h-5">
                            {isToday(parseISO(assignment.due_date)) ? "Today" : format(parseISO(assignment.due_date), "MMM d")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="shadow-sm bg-card/50">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total</div>
                  <div className="text-2xl font-bold">{assignments.length}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm bg-card/50">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Done</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {assignments.filter(a => a.status === 'completed').length}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm bg-card/50">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Left</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {assignments.filter(a => a.status !== 'completed').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Forms and Dialogs */}
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
            onSubmit={handleAddAssignment}
            classOptions={classOptions}
          />
        </>
      )}

      <SemesterSettings
        open={showSemesterSettings}
        onOpenChange={setShowSemesterSettings}
      />
    </div>
  );
}
