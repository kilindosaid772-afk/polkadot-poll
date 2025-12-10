-- Create notification_logs table
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  notification_type TEXT NOT NULL DEFAULT 'results',
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage notification logs" 
ON public.notification_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_notification_logs_election_id ON public.notification_logs(election_id);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);