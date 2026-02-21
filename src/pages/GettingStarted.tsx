import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, ListTodo, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Create your first timeline",
    description:
      "Open Timeline Settings, add a name, then choose a start and end date. Your active timeline controls what appears on Dashboard and Deadlines.",
    icon: CalendarDays,
  },
  {
    title: "Add deadlines to your timeline",
    description:
      "Use Add Deadline or Bulk Add to populate deadlines. Choose a category and a due date.",
    icon: ListTodo,
  },
  {
    title: "Track progress with status",
    description:
      "Update each deadline status in the table (not started, in progress, completed). Completed items are excluded from the dashboard view.",
    icon: CheckCircle2,
  },
  {
    title: "Use Dashboard to view your timeline and plan ahead",
    description:
      "The dashboard highlights upcoming active deadlines and visualizes workload distribution over time so you can track your workload early and stay on top of it.",
    icon: BookOpen,
  },
  {
    title: "Flatten the graph",
    description:
      "Keep marking deadlines as complete to flatten the graph. This will give you a sense of progression and motivation once you near the end of the current timeline.",
    icon: BookOpen,
  },
];

export default function GettingStarted() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-4 md:py-8 space-y-6">
        <Card className="shadow-soft">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Guide</Badge>
              <Badge variant="outline">Getting Started</Badge>
            </div>
            <CardTitle className="text-xl">How to use Semester Flow</CardTitle>
            <CardDescription>
              Follow these steps to set up timelines, manage deadlines, and start workload tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {index + 1}. {step.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/deadlines">Manage Deadlines</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
