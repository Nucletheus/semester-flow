import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { WorkloadChart } from "@/components/WorkloadChart";
import { AssignmentForm } from "@/components/AssignmentForm";
import { SemesterSettings } from "@/components/SemesterSettings";
import { useSemesters } from "@/hooks/useSemesters";
import { useAssignments, Assignment } from "@/hooks/useAssignments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, isPast, isToday } from "date-fns";

export default function Dashboard() {
  const { activeSemester, isLoading: semestersLoading } = useSemesters();
  const { assignments, createAssignment, updateAssignment, deleteAssignment } = useAssignments(
    activeSemester?.id
  );

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showSemesterSettings, setShowSemesterSettings] = useState(false);

  const handleAddAssignment = (values: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">) => {
    createAssignment.mutate(values);
  };

  // Get next 5 upcoming assignments
  const upcomingAssignments = assignments
    .filter((a) => !isPast(parseISO(a.due_date)) || isToday(parseISO(a.due_date)))
    .slice(0, 5);

  const typeIcons: Record<string, string> = {
    Quiz: "📝",
    Exam: "📚",
    Lab: "🔬",
    Essay: "✍️",
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
          <div className="space-y-6">
            {/* Chart - Full width */}
            <WorkloadChart assignments={assignments} semester={activeSemester} />

            {/* Quick Preview of Upcoming Deadlines */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Upcoming Deadlines</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/deadlines" className="gap-2">
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming deadlines. Add your first assignment!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-8 rounded-full"
                            style={{ backgroundColor: assignment.color }}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {typeIcons[assignment.type]} {assignment.assignment_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{assignment.class_name}</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(assignment.due_date), "MMM d")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Forms and Dialogs */}
      {activeSemester && (
        <AssignmentForm
          open={showAssignmentForm}
          onOpenChange={setShowAssignmentForm}
          semesterId={activeSemester.id}
          onSubmit={handleAddAssignment}
        />
      )}

      <SemesterSettings
        open={showSemesterSettings}
        onOpenChange={setShowSemesterSettings}
      />
    </div>
  );
}
