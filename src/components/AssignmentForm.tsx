import { useEffect } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Assignment } from "@/hooks/useAssignments";
import { ClassPicker, ClassOption } from "./ClassPicker";

// Keep color picker for when creating a class or overriding?
// ClassPicker handles color for new classes. But maybe we still want to allow overriding?
// User said: "Making class dropdown ... that way there are no duplicate classes".
// If I allow changing color here, does it update all classes? No, assignments have colors, logic is loose.
// But `ClassPicker` logic is: if new, assign random color.
// I will keep Color picker but maybe hide it if an existing class is selected? Or just let user override.
// Actually, standardizing means we should probably respect the class color.
// But `Assignment` table has `color` column on each row.
// I'll keep the color picker for flexibility but auto-update it when class changes.

const DEFAULT_COLOR = "#5fa37c";

const formSchema = z.object({
  class_name: z.string().min(1, "Class name is required").max(50),
  assignment_name: z.string().min(1, "Assignment name is required").max(100),
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
  classOptions: ClassOption[];
}

export function AssignmentForm({
  open,
  onOpenChange,
  semesterId,
  assignment,
  onSubmit,
  classOptions,
}: AssignmentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class_name: "",
      assignment_name: "",
      color: DEFAULT_COLOR,
    },
  });

  useEffect(() => {
    if (assignment) {
      form.reset({
        class_name: assignment.class_name,
        assignment_name: assignment.assignment_name,
        due_date: new Date(assignment.due_date),
        color: assignment.color,
      });
    } else {
      form.reset({
        class_name: "",
        assignment_name: "",
        color: DEFAULT_COLOR,
      });
    }
  }, [assignment, form, open]);

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      semester_id: semesterId,
      class_name: values.class_name,
      assignment_name: values.assignment_name,
      type: "Quiz", // Default hidden type
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
                <FormItem className="flex flex-col">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <ClassPicker
                      value={field.value}
                      onChange={(val, color) => {
                        field.onChange(val);
                        if (color) {
                          form.setValue("color", color);
                        }
                      }}
                      options={classOptions}
                    />
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

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
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
