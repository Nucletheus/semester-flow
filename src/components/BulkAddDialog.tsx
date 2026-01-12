
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Trash2, X } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Assignment } from "@/hooks/useAssignments";
import { Badge } from "@/components/ui/badge";
import { ClassPicker, ClassOption } from "./ClassPicker";

const DEFAULT_COLOR = "#5fa37c";



interface BulkAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: string;
  onCreate: (assignments: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">[]) => void;
  classOptions: ClassOption[];
}

export function BulkAddDialog({
  open,
  onOpenChange,
  semesterId,
  onCreate,
  classOptions,
}: BulkAddDialogProps) {
  const [className, setClassName] = useState("");
  const [pattern, setPattern] = useState("Lab {n}");

  const [color, setColor] = useState(DEFAULT_COLOR);
  const [startNumber, setStartNumber] = useState(1);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Sort dates chronologically for better UX
  const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

  const generateAssignmentName = (index: number) => {
    return pattern.replace("{n}", String(startNumber + index));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Check if date is already selected to toggle it off, or just append it
    // actually, allowing multiple assignments on same day is fine, but maybe user wants to toggle?
    // Let's assume standard toggle behavior for calendar usually, but here we want to ADD to list.
    // However, the Calendar component 'single' mode just switches selection.
    // We should probably just append the clicked date if it's not already in the list?
    // Or maybe just append it regardless?

    // Better UX: Toggle date in the list.
    const existsIndex = selectedDates.findIndex(d => d.getTime() === date.getTime());
    if (existsIndex >= 0) {
      const newDates = [...selectedDates];
      newDates.splice(existsIndex, 1);
      setSelectedDates(newDates);
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSubmit = () => {
    if (!className || !pattern || sortedDates.length === 0) return;

    const assignments = sortedDates.map((date, index) => ({
      semester_id: semesterId,
      class_name: className,
      assignment_name: generateAssignmentName(index),
      type: "Quiz" as const,
      due_date: format(date, "yyyy-MM-dd"),
      color,
      status: "not started" as const
    }));

    onCreate(assignments);

    // Reset form
    setClassName("");
    setPattern("Lab {n}");
    setColor(DEFAULT_COLOR);
    setStartNumber(1);
    setSelectedDates([]);
    onOpenChange(false);
  };

  const removeDate = (indexToRemove: number) => {
    // Need to find which date in the unsorted/sorted list? 
    // Actually, removing by index of the SORTED list is confusing if we map back to generated names.
    // If I delete "Lab 2", "Lab 3" -> "Lab 2".
    // So removing item at index i of SORTED list is correct behavior for the user.
    const dateToRemove = sortedDates[indexToRemove];
    // Filter out this specific instance of the date.
    // Since we just toggled, unique dates are ensured if we use toggle logic.
    setSelectedDates(selectedDates.filter(d => d.getTime() !== dateToRemove.getTime()));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Bulk Add Assignments
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-hidden h-full">
          {/* Left Column: Configuration & Calendar */}
          <div className="space-y-6 overflow-y-auto pr-2">
            {/* 1. Setup */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
              <h3 className="font-medium flex items-center gap-2 text-sm text-primary">
                1. Configure Pattern
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Class Name</Label>
                  <ClassPicker
                    value={className}
                    onChange={(val, newColor) => {
                      setClassName(val);
                      if (newColor) {
                        setColor(newColor);
                      }
                    }}
                    options={classOptions}
                  />
                </div>




                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Pattern</Label>
                    <Input
                      placeholder="Lab {n}"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      className="h-8"
                    />
                    <p className="text-[10px] text-muted-foreground">Use {'{n}'} for the number</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Start #</Label>
                    <Input
                      type="number"
                      min={1}
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Calendar Selection */}
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2 text-sm text-primary">
                2. Select Dates
              </h3>
              <div className="border rounded-lg p-3 flex justify-center bg-card">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  className="rounded-md border-none selected:bg-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Click dates to add/remove deadlines
              </p>
            </div>
          </div>

          {/* Right Column: Preview & Action */}
          <div className="flex flex-col h-full overflow-hidden border-l pl-6">
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm text-primary">3. Review ({sortedDates.length})</h3>
                {sortedDates.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setSelectedDates([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {sortedDates.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/50 p-6">
                  <CalendarIcon className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No dates selected</p>
                  <p className="text-xs opacity-70 text-center mt-1">Configure your pattern and click dates on the calendar to build your list.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {sortedDates.map((date, i) => (
                    <div key={date.toISOString()} className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-md bg-muted/50 border text-xs font-medium">
                          <span className="opacity-50 text-[10px] uppercase leading-none">{format(date, "MMM")}</span>
                          <span className="text-lg leading-none">{format(date, "d")}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {generateAssignmentName(i)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            <span>{className || "No Class"}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeDate(i)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 mt-auto">
              <Button
                className="w-full h-11 text-base shadow-md"
                onClick={handleSubmit}
                disabled={!className || sortedDates.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create {sortedDates.length} Deadlines
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
}
