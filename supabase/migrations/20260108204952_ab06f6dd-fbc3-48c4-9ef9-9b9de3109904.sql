-- Create semesters table
CREATE TABLE public.semesters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  assignment_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Quiz', 'Exam', 'Lab', 'Essay')),
  due_date DATE NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for semesters
CREATE POLICY "Users can view their own semesters" 
ON public.semesters FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own semesters" 
ON public.semesters FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own semesters" 
ON public.semesters FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own semesters" 
ON public.semesters FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for assignments
CREATE POLICY "Users can view their own assignments" 
ON public.assignments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assignments" 
ON public.assignments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" 
ON public.assignments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" 
ON public.assignments FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_semesters_updated_at
BEFORE UPDATE ON public.semesters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();