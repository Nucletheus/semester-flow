import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Semester {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hidden_categories?: string[] | null;
}

export function useSemesters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const semestersQueryKey = ["semesters", user?.id] as const;

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: semestersQueryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("semesters")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as Semester[];
    },
    enabled: !!user,
  });

  const activeSemester = semesters.find((s) => s.is_active) || semesters[0];

  const createSemester = useMutation({
    mutationFn: async (semester: { name: string; start_date: string; end_date: string; is_active?: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      // If this is the first semester or marked as active, deactivate others
      if (semester.is_active || semesters.length === 0) {
        await supabase
          .from("semesters")
          .update({ is_active: false })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .from("semesters")
        .insert({
          ...semester,
          user_id: user.id,
          is_active: semester.is_active ?? semesters.length === 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKey });
      toast({ title: "Semester created", description: "Your new semester has been added." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSemester = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Semester> & { id: string }) => {
      if (!user) throw new Error("Not authenticated");

      if (updates.is_active) {
        await supabase
          .from("semesters")
          .update({ is_active: false })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .from("semesters")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKey });
      toast({ title: "Semester updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSemester = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("semesters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKey });
      toast({ title: "Semester deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    semesters,
    activeSemester,
    isLoading,
    createSemester,
    updateSemester,
    deleteSemester,
  };
}
