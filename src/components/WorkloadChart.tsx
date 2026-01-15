import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { format, eachDayOfInterval, parseISO, isSameDay, startOfDay, addDays, subDays, differenceInCalendarDays, isSunday } from "date-fns";
import { Assignment } from "@/hooks/useAssignments";
import { Semester } from "@/hooks/useSemesters";
import { getClassThemeColor } from "@/lib/themeColors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";

interface WorkloadChartProps {
  assignments: Assignment[];
  semester: Semester | undefined;
  onColorChange?: (className: string, newColor: string) => void;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  timestamp: number;
  [className: string]: string | number;
}

// Small base value ensures lines are always visible even with 0 assignments
const BASE_VALUE = 0.05;

export function WorkloadChart({ assignments, semester, onColorChange }: WorkloadChartProps) {
  /* State for Relative Mode (100% Stacked) */
  const [isRelativeMode, setIsRelativeMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("workloadChartRelativeMode");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("workloadChartRelativeMode", String(isRelativeMode));
  }, [isRelativeMode]);

  const { chartData, classNames, hasActiveAssignments, maxStackHeight, sundays } = useMemo(() => {
    if (!semester) return { chartData: [], classNames: [], hasActiveAssignments: false, maxStackHeight: 0, sundays: [] };

    // Filter out completed assignments
    const activeAssignments = assignments.filter((a) => a.status !== "completed");
    const hasActiveAssignments = activeAssignments.length > 0;

    // Add buffer
    const startDate = subDays(parseISO(semester.start_date), 2);
    const endDate = addDays(parseISO(semester.end_date), 2);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const uniqueClasses = [...new Set(assignments.map((a) => a.class_name))].sort();

    // Deterministically assign theme-aware colors based on sorted class names
    // This overrides stored hex codes so that the Theme system effectively "takes over" appearance.
    const classColorMap = new Map();
    uniqueClasses.forEach((name) => {
      classColorMap.set(name, getClassThemeColor(name, uniqueClasses));
    });

    let globalMaxDailyTotal = 0;

    // First Pass: Calculate values and find Max Load
    const initialData = days.map((day) => {
      const point: ChartDataPoint = {
        date: format(day, "yyyy-MM-dd"),
        displayDate: format(day, "MMM d"),
        timestamp: startOfDay(day).getTime(),
      };

      let dailyTotal = 0;

      uniqueClasses.forEach((className) => {
        const classAssignments = activeAssignments.filter((a) => a.class_name === className);
        let weight = 0;

        classAssignments.forEach(assignment => {
          const dueDate = parseISO(assignment.due_date);
          const daysUntilDue = differenceInCalendarDays(dueDate, day);

          if (daysUntilDue === 0) weight += 1.0;
          else if (daysUntilDue === 1) weight += 0.75;
          else if (daysUntilDue === 2) weight += 0.50;
          else if (daysUntilDue === 3) weight += 0.25;
          else if (daysUntilDue === 4) weight += 0.1;
          else if (daysUntilDue === 5) weight += 0.05;
          else if (daysUntilDue === 6) weight += 0.025;
          else if (daysUntilDue === 7) weight += 0.01;
        });

        // Add base value so the layer is always present if there are assignments, 
        // but we might want the base value to be constant for the area stacked look.
        // Original code added BASE_VALUE to the count. 
        // If we want the consistent stream look, we add BASE_VALUE if weight > 0 OR if we just want a baseline for the class existence.

        let val = 0;
        if (isRelativeMode) {
          // In relative mode, we only want actual work to show up.
          // No base value padding, as that distorts the 100% normalization for days with 1 vs 10 assignments.
          val = weight;
        } else {
          // Absolute mode: Keep original behavior for visual consistency
          val = weight + BASE_VALUE;
        }

        point[className] = val;
        dailyTotal += val;
      });

      if (dailyTotal > globalMaxDailyTotal) {
        globalMaxDailyTotal = dailyTotal;
      }

      // Store total for second pass
      point._dailyTotal = dailyTotal;

      return point;
    });

    // Second Pass: Add Free Time
    const finalData = initialData.map(point => {
      const dailyTotal = point._dailyTotal as number;

      if (isRelativeMode) {
        // In Relative Mode:
        // If there is ANY work (dailyTotal > 0), the stackOffset="expand" will normalize it to 100%.
        // We do NOT want Free Time to take up space.
        // If there is NO work (dailyTotal == 0), we want Free Time to fill 100%.
        // So we set free_time = 1 (arbitrary positive), so it becomes the only 100% stack.
        point["free_time"] = dailyTotal > 0 ? 0 : 1;
      } else {
        // In Absolute Mode:
        // We don't really use free_time, but to be safe/consistent we can leave it 0
        // OR we can calculate it as gap to max? The user didn't ask for change here.
        point["free_time"] = 0;
      }

      return point;
    });

    const sundays = days.filter(day => isSunday(day));

    return {
      chartData: finalData,
      classNames: uniqueClasses.map((name) => ({
        name,
        color: classColorMap.get(name) || "#6366f1",
      })),
      hasActiveAssignments,
      maxStackHeight: globalMaxDailyTotal,
      sundays,
    };
  }, [assignments, semester, isRelativeMode]);

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

    // If no real assignments, show a "Quiet Day" tooltip or nothing
    if (assignmentsOnDay.length === 0) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl p-3 animate-in fade-in-0 zoom-in-95 duration-200">
          <p className="font-medium text-xs text-muted-foreground">
            {format(parseISO(dateStr), "EEEE, MMMM d")}
          </p>
          <p className="font-semibold text-sm text-foreground">No deadlines</p>
        </div>
      )
    }

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
          <p className="text-muted-foreground font-medium">Create a timeline to begin</p>
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
            Workload Overview
          </CardTitle>
          <div className="flex items-center gap-4">
            {hasActiveAssignments && (
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="relative-mode" className="text-xs font-medium text-muted-foreground">Relative</Label>
                  <Switch
                    id="relative-mode"
                    checked={isRelativeMode}
                    onCheckedChange={setIsRelativeMode}
                  />
                </div>
                <div className="h-4 w-px bg-border/50 mx-2" />
                <div className="flex gap-2 flex-wrap justify-end">
                  {classNames.map(c => (
                    <div
                      key={c.name}
                      className="flex items-center gap-1.5 text-[10px] bg-secondary/50 px-2 py-1 rounded-md border border-border/50 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                      <span className="font-medium opacity-70">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 0, left: 10, bottom: 0 }}
                  stackOffset={isRelativeMode ? "expand" : undefined}
                >
                  <defs>
                    {classNames.map(({ name, color }) => (
                      <linearGradient key={name} id={`gradient-${name.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  {chartData.length > 0 && (
                    <ReferenceArea
                      x1={chartData[0].displayDate}
                      x2={format(new Date(), "MMM d")}
                      fill="#4f4f4fff"
                      fillOpacity={0.3}
                    />
                  )}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--foreground))"
                    opacity={0.5}
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
                    hide={!isRelativeMode}
                    domain={isRelativeMode ? [0, 1] : [0, Math.ceil(maxStackHeight) || 1]}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => isRelativeMode ? `${(value * 100).toFixed(0)}%` : value}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />

                  {sundays.map((date, index) => (
                    <ReferenceLine
                      key={`sunday-${index}`}
                      x={format(date, "MMM d")}
                      stroke="hsl(var(--muted-foreground))"
                      strokeOpacity={0.2}
                      strokeDasharray="3 3"
                      label={{
                        value: format(date, "MMM d"),
                        position: 'insideTop',
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 9,
                        opacity: 0.5,
                        offset: 10
                      }}
                    />
                  ))}

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
                      type="monotone" // Smooth curve
                      dataKey={name}
                      stackId="1" // Stack them
                      stroke={color}
                      strokeWidth={1.5}
                      fill={`url(#gradient-${name.replace(/\s+/g, '-')})`}
                      animationDuration={1500}
                    />
                  ))}

                  {isRelativeMode && (
                    <Area
                      type="monotone"
                      dataKey="free_time"
                      stackId="1"
                      stroke="transparent"
                      fill="hsl(var(--muted))"
                      fillOpacity={0.1}
                      animationDuration={1500}
                      activeDot={false}
                      tooltipType="none"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


