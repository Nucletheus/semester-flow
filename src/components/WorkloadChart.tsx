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
import { format, eachDayOfInterval, parseISO, startOfDay, addDays, subDays, isSunday } from "date-fns";
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
  hiddenCategories?: string[];
  onHiddenCategoriesChange?: (categories: string[]) => void;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  timestamp: number;
  [className: string]: string | number;
}

// Small base value ensures lines are always visible even with 0 assignments
const BASE_VALUE = 0.05;

export function WorkloadChart({
  assignments,
  semester,
  onColorChange,
  hiddenCategories: propHiddenCategories,
  onHiddenCategoriesChange,
}: WorkloadChartProps) {
  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status !== "completed"),
    [assignments]
  );
  const parsedActiveAssignments = useMemo(
    () =>
      activeAssignments.map((assignment) => {
        const dueDate = parseISO(assignment.due_date);
        return {
          ...assignment,
          dueDate,
          dueDateKey: format(dueDate, "yyyy-MM-dd"),
        };
      }),
    [activeAssignments]
  );

  /* State for Relative Mode (100% Stacked) */
  const [isRelativeMode, setIsRelativeMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("workloadChartRelativeMode");
      return saved === "true";
    }
    return false;
  });

  /* Local state for Hidden Categories (fallback when props not provided) */
  const [localHiddenCategories, setLocalHiddenCategories] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("workloadChartHiddenCategories");
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  // Use prop value if provided, otherwise fall back to local state
  const hiddenCategories = useMemo(() => {
    if (propHiddenCategories !== undefined) {
      return new Set(propHiddenCategories);
    }
    return localHiddenCategories;
  }, [propHiddenCategories, localHiddenCategories]);

  useEffect(() => {
    localStorage.setItem("workloadChartRelativeMode", String(isRelativeMode));
  }, [isRelativeMode]);

  // Only save to localStorage if not using database persistence
  useEffect(() => {
    if (propHiddenCategories === undefined) {
      localStorage.setItem("workloadChartHiddenCategories", JSON.stringify([...localHiddenCategories]));
    }
  }, [localHiddenCategories, propHiddenCategories]);

  const toggleCategory = (categoryName: string) => {
    const currentHidden = Array.from(hiddenCategories);
    let newHidden: string[];

    if (hiddenCategories.has(categoryName)) {
      newHidden = currentHidden.filter(c => c !== categoryName);
    } else {
      newHidden = [...currentHidden, categoryName];
    }

    // If using database persistence (prop callback provided), call it
    if (onHiddenCategoriesChange) {
      onHiddenCategoriesChange(newHidden);
    } else {
      // Otherwise update local state
      setLocalHiddenCategories(new Set(newHidden));
    }
  };

  const { chartData, classNames, hasActiveAssignments, maxStackHeight, sundays, classColorMap, tooltipAssignmentsByDate } = useMemo(() => {
    if (!semester) {
      return {
        chartData: [],
        classNames: [],
        hasActiveAssignments: false,
        maxStackHeight: 0,
        sundays: [],
        classColorMap: new Map(),
        tooltipAssignmentsByDate: new Map<string, Assignment[]>(),
      };
    }

    const hasActiveAssignments = parsedActiveAssignments.length > 0;

    // Add buffer
    const startDate = subDays(parseISO(semester.start_date), 2);
    const endDate = addDays(parseISO(semester.end_date), 2);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const uniqueClasses = [...new Set(parsedActiveAssignments.map((a) => a.class_name))].sort();

    // Deterministically assign theme-aware colors based on sorted class names
    // This overrides stored hex codes so that the Theme system effectively "takes over" appearance.
    const classColorMap = new Map();
    uniqueClasses.forEach((name) => {
      classColorMap.set(name, getClassThemeColor(name, uniqueClasses, true));
    });

    const weightByOffset = [1, 0.75, 0.5, 0.25, 0.1, 0.05, 0.025, 0.01];
    const classWeightedLoadByDate = new Map<string, Map<string, number>>();

    uniqueClasses.forEach((className) => {
      classWeightedLoadByDate.set(className, new Map());
    });

    parsedActiveAssignments.forEach((assignment) => {
      const classWeightMap = classWeightedLoadByDate.get(assignment.class_name);
      if (!classWeightMap) return;

      weightByOffset.forEach((weight, offset) => {
        const dayKey = format(addDays(assignment.dueDate, -offset), "yyyy-MM-dd");
        classWeightMap.set(dayKey, (classWeightMap.get(dayKey) ?? 0) + weight);
      });
    });

    let globalMaxDailyTotal = 0;
    const RELATIVE_BASELINE = 0.2;

    const initialData = days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const point: ChartDataPoint = {
        date: dayKey,
        displayDate: format(day, "MMM d"),
        timestamp: startOfDay(day).getTime(),
      };

      let dailyTotal = 0;

      uniqueClasses.forEach((className) => {
        const weight = classWeightedLoadByDate.get(className)?.get(dayKey) ?? 0;
        let val = 0;
        if (isRelativeMode) {
          val = weight + RELATIVE_BASELINE;
        } else {
          val = weight + BASE_VALUE;
        }

        point[className] = val;
        dailyTotal += val;
      });

      if (dailyTotal > globalMaxDailyTotal) {
        globalMaxDailyTotal = dailyTotal;
      }

      return point;
    });

    const finalData = initialData.map((point) => ({ ...point, free_time: 0 }));

    const sundays = days.filter(day => isSunday(day));
    const classOrderMap = new Map(uniqueClasses.map((name, index) => [name, index]));
    const tooltipAssignmentsByDate = new Map<string, Assignment[]>();
    parsedActiveAssignments.forEach((assignment) => {
      const existing = tooltipAssignmentsByDate.get(assignment.dueDateKey) ?? [];
      existing.push(assignment);
      tooltipAssignmentsByDate.set(assignment.dueDateKey, existing);
    });
    tooltipAssignmentsByDate.forEach((dateAssignments, dateKey) => {
      tooltipAssignmentsByDate.set(
        dateKey,
        [...dateAssignments].sort((a, b) => {
          const indexA = classOrderMap.get(a.class_name) ?? 0;
          const indexB = classOrderMap.get(b.class_name) ?? 0;
          return indexB - indexA;
        })
      );
    });

    return {
      chartData: finalData,
      classNames: uniqueClasses.map((name) => ({
        name,
        color: classColorMap.get(name) || "#6366f1",
      })),
      hasActiveAssignments,
      maxStackHeight: globalMaxDailyTotal,
      sundays,
      classColorMap,
      tooltipAssignmentsByDate,
    };
  }, [parsedActiveAssignments, semester, isRelativeMode]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    // Payload structure for Recharts hover:
    const dataPoint = payload[0].payload as ChartDataPoint;
    const dateStr = dataPoint.date;

    const assignmentsOnDay = tooltipAssignmentsByDate.get(dateStr) ?? [];

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
                style={{
                  backgroundColor: classColorMap.get(a.class_name) || a.color,
                  borderColor: classColorMap.get(a.class_name) || a.color
                }}
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-2 sm:mb-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            Workload Overview
          </CardTitle>
          {hasActiveAssignments && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Label htmlFor="relative-mode" className="text-xs font-medium text-muted-foreground">
                Relative
              </Label>
              <Switch
                id="relative-mode"
                checked={isRelativeMode}
                onCheckedChange={setIsRelativeMode}
              />
            </div>
          )}
        </div>
        {hasActiveAssignments && (
          <div className="flex gap-2 flex-wrap sm:flex-nowrap overflow-x-auto">
            {classNames.map(c => {
              const isHidden = hiddenCategories.has(c.name);
              return (
                <button
                  key={c.name}
                  onClick={() => toggleCategory(c.name)}
                  className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border transition-all cursor-pointer select-none ${isHidden
                    ? 'bg-secondary/20 border-border/30 opacity-50'
                    : 'bg-secondary/50 border-border/50 hover:bg-secondary/70'
                    }`}
                  title={isHidden ? `Show ${c.name}` : `Hide ${c.name}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full shadow-sm transition-opacity ${isHidden ? 'opacity-30' : ''}`}
                    style={{ backgroundColor: c.color }}
                  />
                  <span className={`font-medium ${isHidden ? 'opacity-50 line-through' : 'opacity-70'}`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
            <div className="h-64 sm:h-80 w-full relative group rounded-xl bg-secondary/20 dark:bg-secondary/10 ring-1 ring-inset ring-black/5 dark:ring-white/5 overflow-hidden shadow-inner">
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

                  {classNames
                    .filter(({ name }) => !hiddenCategories.has(name))
                    .map(({ name, color }) => (
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


