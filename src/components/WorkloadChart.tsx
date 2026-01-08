import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { Assignment } from "@/hooks/useAssignments";
import { Semester } from "@/hooks/useSemesters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface WorkloadChartProps {
  assignments: Assignment[];
  semester: Semester | undefined;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  [className: string]: string | number;
}

export function WorkloadChart({ assignments, semester }: WorkloadChartProps) {
  const { chartData, classNames } = useMemo(() => {
    if (!semester) return { chartData: [], classNames: [] };

    const startDate = parseISO(semester.start_date);
    const endDate = parseISO(semester.end_date);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const uniqueClasses = [...new Set(assignments.map((a) => a.class_name))];
    const classColorMap = new Map(assignments.map((a) => [a.class_name, a.color]));

    const data: ChartDataPoint[] = days.map((day) => {
      const point: ChartDataPoint = {
        date: format(day, "yyyy-MM-dd"),
        displayDate: format(day, "MMM d"),
      };

      uniqueClasses.forEach((className) => {
        const count = assignments.filter(
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
    };
  }, [assignments, semester]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    const assignmentsOnDay = assignments.filter(
      (a) => format(parseISO(a.due_date), "yyyy-MM-dd") === label
    );

    if (assignmentsOnDay.length === 0) return null;

    return (
      <div className="chart-tooltip">
        <p className="font-medium text-sm mb-2">
          {format(parseISO(label), "EEEE, MMMM d")}
        </p>
        <div className="space-y-1">
          {assignmentsOnDay.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: a.color }}
              />
              <span className="text-muted-foreground">{a.class_name}:</span>
              <span className="font-medium">{a.assignment_name}</span>
              <span className="text-xs text-muted-foreground">({a.type})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!semester) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Create a semester to see your workload chart</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Semester Workload
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Assignments due throughout {semester.name}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {classNames.map(({ name, color }) => (
                  <linearGradient key={name} id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {classNames.map(({ name, color }) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stackId="1"
                  stroke={color}
                  fill={`url(#gradient-${name})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {classNames.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            {classNames.map(({ name, color }) => (
              <div key={name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
