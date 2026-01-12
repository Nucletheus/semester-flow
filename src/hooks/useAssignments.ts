import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Assignment {
  id: string;
  user_id: string;
  semester_id: string;
  class_name: string;
  assignment_name: string;
  type: "Quiz" | "Exam" | "Lab" | "Essay";
  status?: "not started" | "in progress" | "completed";
  due_date: string;
  color: string;
  created_at: string;
  updated_at: string;
}



export const useAssignments = (semesterId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments", semesterId],
    queryFn: async () => {
      if (!user || !semesterId) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("semester_id", semesterId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Assignment[];
    },
    enabled: !!user && !!semesterId,
  });

  const createAssignment = useMutation({
    mutationFn: async (assignment: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("assignments")
        .insert({ ...assignment, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: "Assignment added", description: "Your deadline has been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAssignments = useMutation({
    mutationFn: async (assignments: Omit<Assignment, "id" | "user_id" | "created_at" | "updated_at">[]) => {
      if (!user) throw new Error("Not authenticated");
      const assignmentsWithUser = assignments.map(a => ({ ...a, user_id: user.id }));
      const { data, error } = await supabase
        .from("assignments")
        .insert(assignmentsWithUser)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: "Assignments added", description: `Successfully created ${data?.length} deadlines.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Assignment> & { id: string }) => {
      const { data, error } = await supabase
        .from("assignments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: "Assignment updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateClassColor = useMutation({
    mutationFn: async ({ className, newColor }: { className: string; newColor: string }) => {
      if (!user || !semesterId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("assignments")
        .update({ color: newColor })
        .eq("semester_id", semesterId)
        .eq("class_name", className)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: "Class color updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({ title: "Assignment deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    assignments,
    isLoading,
    createAssignment,
    createAssignments,
    updateAssignment,
    deleteAssignment,
    updateClassColor,

  };
}
