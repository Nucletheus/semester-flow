import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Assignment } from "@/hooks/useAssignments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface DeadlineTableProps {
  assignments: Assignment[];
  semesterId: string;
  onUpdate: (id: string, updates: Partial<Assignment>) => void;
  onDelete: (id: string) => void;
  onCreate: (assignment: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

interface EditingCell {
  id: string;
  field: keyof Assignment;
}

interface NewRow {
  class_name: string;
  assignment_name: string;
  type: "Quiz" | "Exam" | "Lab" | "Essay";
  due_date: Date | undefined;
  color: string;
}

export function DeadlineTable({
  assignments,
  semesterId,
  onUpdate,
  onDelete,
  onCreate,
}: DeadlineTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRow, setNewRow] = useState<NewRow>({
    class_name: "",
    assignment_name: "",
    type: "Quiz",
    due_date: undefined,
    color: CLASS_COLORS[0].value,
  });

  const startEditing = (id: string, field: keyof Assignment, currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const saveEdit = (id: string, field: keyof Assignment) => {
    if (field === "due_date") {
      onUpdate(id, { [field]: editValue });
    } else {
      onUpdate(id, { [field]: editValue });
    }
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleNewRowSubmit = () => {
    if (!newRow.class_name || !newRow.assignment_name || !newRow.due_date) return;
    
    onCreate({
      semester_id: semesterId,
      class_name: newRow.class_name,
      assignment_name: newRow.assignment_name,
      type: newRow.type,
      due_date: format(newRow.due_date, "yyyy-MM-dd"),
      color: newRow.color,
    });
    
    setNewRow({
      class_name: "",
      assignment_name: "",
      type: "Quiz",
      due_date: undefined,
      color: CLASS_COLORS[0].value,
    });
    setIsAddingNew(false);
  };

  const renderEditableCell = (
    assignment: Assignment,
    field: keyof Assignment,
    displayValue: string
  ) => {
    const isEditing = editingCell?.id === assignment.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit(assignment.id, field);
              if (e.key === "Escape") cancelEdit();
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(assignment.id, field)}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    return (
      <span
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors"
        onClick={() => startEditing(assignment.id, field, displayValue)}
      >
        {displayValue}
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">Class</TableHead>
            <TableHead className="w-[220px]">Assignment</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[140px]">Due Date</TableHead>
            <TableHead className="w-[80px]">Color</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id} className="group">
              <TableCell className="font-medium">
                {renderEditableCell(assignment, "class_name", assignment.class_name)}
              </TableCell>
              <TableCell>
                {renderEditableCell(assignment, "assignment_name", assignment.assignment_name)}
              </TableCell>
              <TableCell>
                <Select
                  value={assignment.type}
                  onValueChange={(value) => onUpdate(assignment.id, { type: value as Assignment["type"] })}
                >
                  <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent hover:bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 font-normal hover:bg-muted/50"
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-50" />
                      {format(parseISO(assignment.due_date), "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseISO(assignment.due_date)}
                      onSelect={(date) => {
                        if (date) onUpdate(assignment.id, { due_date: format(date, "yyyy-MM-dd") });
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-6 h-6 rounded-md border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: assignment.color }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex flex-wrap gap-1.5 max-w-[160px]">
                      {CLASS_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => onUpdate(assignment.id, { color: color.value })}
                          className={cn(
                            "w-6 h-6 rounded-md transition-all",
                            assignment.color === color.value
                              ? "ring-2 ring-offset-2 ring-primary scale-110"
                              : "hover:scale-105"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => onDelete(assignment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {/* New row input */}
          {isAddingNew ? (
            <TableRow className="bg-muted/30">
              <TableCell>
                <Input
                  placeholder="Class name..."
                  value={newRow.class_name}
                  onChange={(e) => setNewRow({ ...newRow, class_name: e.target.value })}
                  className="h-8 text-sm"
                  autoFocus
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Assignment name..."
                  value={newRow.assignment_name}
                  onChange={(e) => setNewRow({ ...newRow, assignment_name: e.target.value })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={newRow.type}
                  onValueChange={(value) => setNewRow({ ...newRow, type: value as NewRow["type"] })}
                >
                  <SelectTrigger className="h-8 w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 px-2 text-sm font-normal",
                        !newRow.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {newRow.due_date ? format(newRow.due_date, "MMM d") : "Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newRow.due_date}
                      onSelect={(date) => setNewRow({ ...newRow, due_date: date })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-6 h-6 rounded-md border border-border"
                      style={{ backgroundColor: newRow.color }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex flex-wrap gap-1.5 max-w-[160px]">
                      {CLASS_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewRow({ ...newRow, color: color.value })}
                          className={cn(
                            "w-6 h-6 rounded-md transition-all",
                            newRow.color === color.value
                              ? "ring-2 ring-offset-2 ring-primary scale-110"
                              : "hover:scale-105"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleNewRowSubmit}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsAddingNew(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setIsAddingNew(true)}
            >
              <TableCell colSpan={6} className="text-muted-foreground text-sm py-3">
                + Add new assignment...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
