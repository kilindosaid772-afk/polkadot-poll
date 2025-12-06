-- Enable realtime for candidates table (votes already updates candidates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;

-- Enable realtime for elections table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.elections;