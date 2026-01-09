import { useState } from "react";
import { format, addDays, addWeeks } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Assignment } from "@/hooks/useAssignments";

const CLASS_COLORS = [
  { name: "Sage", value: "#5fa37c" },
  { name: "Coral", value: "#e88a6a" },
  { name: "Sky", value: "#5ba3d9" },
  { name: "Lavender", value: "#a78bdb" },
  { name: "Amber", value: "#d9a33c" },
  { name: "Rose", value: "#db7093" },
  { name: "Teal", value: "#3db39e" },
  { name: "Indigo", value: "#6366f1" },
];

const TYPE_OPTIONS = [
  { value: "Quiz", label: "📝 Quiz" },
  { value: "Exam", label: "📚 Exam" },
  { value: "Lab", label: "🔬 Lab" },
  { value: "Essay", label: "✍️ Essay" },
];

interface BulkAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: string;
  onCreate: (assignment: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

type IntervalType = "days" | "weeks";

export function BulkAddDialog({
  open,
  onOpenChange,
  semesterId,
  onCreate,
}: BulkAddDialogProps) {
  const [className, setClassName] = useState("");
  const [baseName, setBaseName] = useState("");
  const [type, setType] = useState<"Quiz" | "Exam" | "Lab" | "Essay">("Lab");
  const [color, setColor] = useState(CLASS_COLORS[0].value);
  const [startNumber, setStartNumber] = useState(1);
  const [endNumber, setEndNumber] = useState(5);
  const [firstDueDate, setFirstDueDate] = useState<Date | undefined>();
  const [interval, setInterval] = useState(1);
  const [intervalType, setIntervalType] = useState<IntervalType>("weeks");

  const generatePreview = () => {
    if (!baseName || !firstDueDate || startNumber > endNumber) return [];
    
    const items: { name: string; date: Date }[] = [];
    for (let i = startNumber; i <= endNumber; i++) {
      const offset = i - startNumber;
      const date = intervalType === "weeks" 
        ? addWeeks(firstDueDate, offset * interval)
        : addDays(firstDueDate, offset * interval);
      items.push({
        name: `${baseName} ${i}`,
        date,
      });
    }
    return items;
  };

  const preview = generatePreview();

  const handleSubmit = () => {
    if (!className || !baseName || !firstDueDate) return;

    preview.forEach((item) => {
      onCreate({
        semester_id: semesterId,
        class_name: className,
        assignment_name: item.name,
        type,
        due_date: format(item.date, "yyyy-MM-dd"),
        color,
      });
    });

    // Reset form
    setClassName("");
    setBaseName("");
    setType("Lab");
    setColor(CLASS_COLORS[0].value);
    setStartNumber(1);
    setEndNumber(5);
    setFirstDueDate(undefined);
    setInterval(1);
    setIntervalType("weeks");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Bulk Add Assignments
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Class Name */}
          <div className="space-y-2">
            <Label>Class Name</Label>
            <Input
              placeholder="e.g., BIOL 1011"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          {/* Assignment Base Name */}
          <div className="space-y-2">
            <Label>Assignment Base Name</Label>
            <Input
              placeholder="e.g., Lab Report"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Numbers will be added automatically (e.g., "Lab Report 1, 2, 3...")
            </p>
          </div>

          {/* Type and Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {CLASS_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "w-6 h-6 rounded-md transition-all",
                      color === c.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Number Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Number</Label>
              <Input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Number</Label>
              <Input
                type="number"
                min={startNumber}
                value={endNumber}
                onChange={(e) => setEndNumber(parseInt(e.target.value) || startNumber)}
              />
            </div>
          </div>

          {/* First Due Date and Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !firstDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {firstDueDate ? format(firstDueDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={firstDueDate}
                    onSelect={setFirstDueDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Interval</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <Select value={intervalType} onValueChange={(v) => setIntervalType(v as IntervalType)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">days</SelectItem>
                    <SelectItem value="weeks">weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Preview ({preview.length} assignments)</Label>
              <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-[150px] overflow-y-auto space-y-1.5">
                {preview.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {format(item.date, "EEE, MMM d")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!className || !baseName || !firstDueDate || preview.length === 0}
            >
              Add {preview.length} Assignments
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
