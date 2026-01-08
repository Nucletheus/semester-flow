import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

const formSchema = z.object({
  class_name: z.string().min(1, "Class name is required").max(50),
  assignment_name: z.string().min(1, "Assignment name is required").max(100),
  type: z.enum(["Quiz", "Exam", "Lab", "Essay"]),
  due_date: z.date({ required_error: "Due date is required" }),
  color: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: string;
  assignment?: Assignment | null;
  onSubmit: (values: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

export function AssignmentForm({
  open,
  onOpenChange,
  semesterId,
  assignment,
  onSubmit,
}: AssignmentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class_name: "",
      assignment_name: "",
      type: "Quiz",
      color: CLASS_COLORS[0].value,
    },
  });

  useEffect(() => {
    if (assignment) {
      form.reset({
        class_name: assignment.class_name,
        assignment_name: assignment.assignment_name,
        type: assignment.type,
        due_date: new Date(assignment.due_date),
        color: assignment.color,
      });
    } else {
      form.reset({
        class_name: "",
        assignment_name: "",
        type: "Quiz",
        color: CLASS_COLORS[0].value,
      });
    }
  }, [assignment, form, open]);

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      semester_id: semesterId,
      class_name: values.class_name,
      assignment_name: values.assignment_name,
      type: values.type,
      due_date: format(values.due_date, "yyyy-MM-dd"),
      color: values.color,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{assignment ? "Edit Assignment" : "Add New Deadline"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="class_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., BIOL 1011" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignment_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lab Report 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Quiz">📝 Quiz</SelectItem>
                        <SelectItem value="Exam">📚 Exam</SelectItem>
                        <SelectItem value="Lab">🔬 Lab</SelectItem>
                        <SelectItem value="Essay">✍️ Essay</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "MMM d, yyyy") : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Color</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {CLASS_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => field.onChange(color.value)}
                        className={cn(
                          "w-8 h-8 rounded-lg transition-all",
                          field.value === color.value
                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                            : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{assignment ? "Save Changes" : "Add Assignment"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
