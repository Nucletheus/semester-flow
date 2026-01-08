import { format, parseISO, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import { Assignment } from "@/hooks/useAssignments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Pencil, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

interface DeadlineListProps {
  assignments: Assignment[];
  onEdit: (assignment: Assignment) => void;
  onDelete: (id: string) => void;
}

export function DeadlineList({ assignments, onEdit, onDelete }: DeadlineListProps) {
  const getUrgencyLabel = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isPast(date) && !isToday(date)) return { label: "Overdue", variant: "destructive" as const };
    if (isToday(date)) return { label: "Today", variant: "destructive" as const };
    if (isTomorrow(date)) return { label: "Tomorrow", variant: "secondary" as const };
    const days = differenceInDays(date, new Date());
    if (days <= 7) return { label: `${days} days`, variant: "secondary" as const };
    return null;
  };

  const upcomingAssignments = assignments.filter(
    (a) => !isPast(parseISO(a.due_date)) || isToday(parseISO(a.due_date))
  );

  const pastAssignments = assignments.filter(
    (a) => isPast(parseISO(a.due_date)) && !isToday(parseISO(a.due_date))
  );

  const typeIcons: Record<string, string> = {
    Quiz: "📝",
    Exam: "📚",
    Lab: "🔬",
    Essay: "✍️",
  };

  const renderAssignment = (assignment: Assignment) => {
    const urgency = getUrgencyLabel(assignment.due_date);
    const isOverdue = isPast(parseISO(assignment.due_date)) && !isToday(parseISO(assignment.due_date));

    return (
      <div
        key={assignment.id}
        className={`group flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-soft ${
          isOverdue ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
        }`}
      >
        <div
          className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0"
          style={{ backgroundColor: assignment.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm leading-tight">
                {typeIcons[assignment.type]} {assignment.assignment_name}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">{assignment.class_name}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(assignment)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(assignment.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {format(parseISO(assignment.due_date), "EEE, MMM d")}
            </span>
            <Badge variant="outline" className="text-xs">
              {assignment.type}
            </Badge>
            {urgency && (
              <Badge variant={urgency.variant} className="text-xs">
                {isOverdue && <AlertCircle className="w-3 h-3 mr-1" />}
                {urgency.label}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Upcoming Deadlines
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {upcomingAssignments.length} assignment{upcomingAssignments.length !== 1 ? "s" : ""} due
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No assignments yet</p>
            <p className="text-xs mt-1">Add your first deadline to get started</p>
          </div>
        ) : (
          <>
            {upcomingAssignments.map(renderAssignment)}
            {pastAssignments.length > 0 && (
              <div className="pt-4 mt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Past Deadlines
                </p>
                <div className="space-y-3 opacity-60">
                  {pastAssignments.map(renderAssignment)}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
