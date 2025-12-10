import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Mail, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NotificationLog {
  id: string;
  election_id: string;
  recipient_email: string;
  recipient_name: string | null;
  notification_type: string;
  status: string;
  sent_at: string;
  error_message: string | null;
}

interface NotificationHistoryLogProps {
  electionId?: string;
}

export function NotificationHistoryLog({ electionId }: NotificationHistoryLogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['notification-logs', electionId],
    queryFn: async () => {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (electionId) {
        query = query.eq('election_id', electionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NotificationLog[];
    },
  });

  const successCount = logs?.filter(l => l.status === 'sent').length || 0;
  const failedCount = logs?.filter(l => l.status === 'failed').length || 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-xl border border-border bg-card">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-4 h-auto"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Notification History</p>
              <p className="text-sm text-muted-foreground">
                {logs?.length || 0} notifications sent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                {successCount}
              </Badge>
              {failedCount > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  {failedCount}
                </Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="border-t border-border p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.recipient_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{log.recipient_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.notification_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.status === 'sent' ? (
                          <Badge className="bg-success/10 text-success border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications sent yet</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
