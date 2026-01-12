import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, eachDayOfInterval, parseISO, isSameDay, startOfDay } from "date-fns";
import { Assignment } from "@/hooks/useAssignments";
import { Semester } from "@/hooks/useSemesters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2 } from "lucide-react";

interface WorkloadChartProps {
  assignments: Assignment[];
  semester: Semester | undefined;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  timestamp: number;
  [className: string]: string | number;
}

export function WorkloadChart({ assignments, semester }: WorkloadChartProps) {
  const { chartData, classNames, hasActiveAssignments } = useMemo(() => {
    if (!semester) return { chartData: [], classNames: [], hasActiveAssignments: false };

    // Filter out completed assignments to "flatten the curve"
    const activeAssignments = assignments.filter((a) => a.status !== "completed");
    const hasActiveAssignments = activeAssignments.length > 0;

    const startDate = parseISO(semester.start_date);
    const endDate = parseISO(semester.end_date);
    // Expand range slightly to prevent edge cutting
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const uniqueClasses = [...new Set(assignments.map((a) => a.class_name))].sort();
    const classColorMap = new Map(assignments.map((a) => [a.class_name, a.color]));

    const data: ChartDataPoint[] = days.map((day) => {
      const point: ChartDataPoint = {
        date: format(day, "yyyy-MM-dd"),
        displayDate: format(day, "MMM d"),
        timestamp: startOfDay(day).getTime(),
      };

      uniqueClasses.forEach((className) => {
        // Only count active assignments
        const count = activeAssignments.filter(
          (a) => a.class_name === className && isSameDay(parseISO(a.due_date), day)
        ).length;
        point[className] = count;
      });

      return point;
    });

    return {
      chartData: data,
      classNames: uniqueClasses.map((name) => ({
        name,
        color: classColorMap.get(name) || "#6366f1",
      })),
      hasActiveAssignments,
    };
  }, [assignments, semester]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    // Payload structure for Recharts hover:
    const dataPoint = payload[0].payload as ChartDataPoint;
    const dateStr = dataPoint.date;

    const assignmentsOnDay = assignments.filter(
      (a) =>
        format(parseISO(a.due_date), "yyyy-MM-dd") === dateStr &&
        a.status !== "completed"
    );

    if (assignmentsOnDay.length === 0) return null;

    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl p-3 animate-in fade-in-0 zoom-in-95 duration-200 min-w-[180px]">
        <p className="font-semibold text-sm mb-2 text-foreground/80 border-b border-border/50 pb-1">
          {format(parseISO(dateStr), "EEEE, MMMM d")}
        </p>
        <div className="space-y-2">
          {assignmentsOnDay.map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-offset-1 ring-offset-background"
                style={{ backgroundColor: a.color, borderColor: a.color }}
              />
              <div className="flex flex-col">
                <span className="font-medium leading-none">{a.assignment_name}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{a.class_name}</span>

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!semester) {
    return (
      <Card className="shadow-soft border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Create a semester to begin</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft overflow-hidden border-none ring-1 ring-border/50 bg-gradient-to-b from-card to-secondary/10">
      <CardHeader className="pb-4 border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            Semester Workload
          </CardTitle>
          {hasActiveAssignments && (
            <div className="flex gap-2">
              {classNames.map(c => (
                <div key={c.name} className="flex items-center gap-1.5 text-[10px] bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="font-medium opacity-70">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!hasActiveAssignments ? (
          <div className="flex flex-col items-center justify-center h-80 text-center space-y-4 bg-secondary/5 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
              <CheckCircle2 className="w-16 h-16 text-green-500 relative z-10" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Active Workload Flattened!</h3>
              <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
                No incomplete assignments visible. Great job staying ahead of the curve!
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="h-80 w-full relative group rounded-xl bg-secondary/20 dark:bg-secondary/10 ring-1 ring-inset ring-black/5 dark:ring-white/5 overflow-hidden shadow-inner">
              {/* Background Pattern for contrast */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)]" />

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    {classNames.map(({ name, color }) => (
                      <linearGradient key={name} id={`gradient-${name.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.5} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--foreground))"
                    opacity={0.05}
                  />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                    tickMargin={10}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />

                  <ReferenceLine
                    x={format(new Date(), "MMM d")}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{
                      value: 'Today',
                      position: 'top',
                      fill: 'hsl(var(--destructive))',
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}
                  />

                  {classNames.map(({ name, color }) => (
                    <Area
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stackId="1"
                      stroke={color}
                      fill={`url(#gradient-${name.replace(/\s+/g, '-')})`}
                      strokeWidth={3}
                      animationDuration={1500}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
