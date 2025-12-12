import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSNotificationRequest {
  electionId: string;
  electionTitle: string;
  notificationType: 'deadline_reminder' | 'turnout_alert' | 'results';
  hoursRemaining?: number;
  turnoutPercentage?: number;
  threshold?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const briqApiKey = Deno.env.get('BRIQ_API_KEY');
    if (!briqApiKey) {
      throw new Error('BRIQ_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      electionId, 
      electionTitle, 
      notificationType,
      hoursRemaining,
      turnoutPercentage,
      threshold
    }: SMSNotificationRequest = await req.json();

    console.log(`Processing SMS notification: ${notificationType} for election ${electionId}`);

    // Determine recipients based on notification type
    let recipients: { phone: string; name: string; user_id: string }[] = [];

    if (notificationType === 'turnout_alert') {
      // Send to admins
      const { data: adminRoles, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminError) throw adminError;

      const adminIds = adminRoles?.map(r => r.user_id) || [];
      
      const { data: adminProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, phone')
        .in('user_id', adminIds)
        .not('phone', 'is', null);

      if (profileError) throw profileError;

      recipients = adminProfiles?.filter(p => p.phone).map(p => ({
        phone: p.phone!,
        name: p.name,
        user_id: p.user_id,
      })) || [];
    } else {
      // Send to approved voters who haven't voted
      const { data: voters, error: voterError } = await supabase
        .from('profiles')
        .select('user_id, name, phone')
        .eq('is_approved', true)
        .eq('has_voted', false)
        .not('phone', 'is', null);

      if (voterError) throw voterError;

      recipients = voters?.filter(v => v.phone).map(v => ({
        phone: v.phone!,
        name: v.name,
        user_id: v.user_id,
      })) || [];
    }

    if (recipients.length === 0) {
      console.log('No recipients with phone numbers found');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No recipients with phone numbers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        // Construct message based on notification type
        let message = '';
        
        if (notificationType === 'deadline_reminder') {
          message = `Reminder: ${electionTitle} ends in ${hoursRemaining} hours. Cast your vote now!`;
        } else if (notificationType === 'turnout_alert') {
          message = `Alert: ${electionTitle} has low turnout (${turnoutPercentage?.toFixed(1)}%). Action may be needed.`;
        } else if (notificationType === 'results') {
          message = `${electionTitle} results are now available. Check your email or dashboard for details.`;
        }

        // Send SMS via Briq API
        const smsResponse = await fetch('https://api.briq.africa/v1/sms/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${briqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: recipient.phone,
            message: message,
            sender_id: 'BlockVote',
          }),
        });

        if (!smsResponse.ok) {
          const errorText = await smsResponse.text();
          console.error(`Failed to send SMS to ${recipient.phone}: ${errorText}`);
          failedCount++;

          // Log failed notification
          await supabase.from('notification_logs').insert({
            election_id: electionId,
            recipient_email: recipient.phone, // Using phone as identifier
            recipient_name: recipient.name,
            notification_type: `sms_${notificationType}`,
            status: 'failed',
            error_message: errorText,
          });
        } else {
          console.log(`SMS sent successfully to ${recipient.phone}`);
          sentCount++;

          // Log successful notification
          await supabase.from('notification_logs').insert({
            election_id: electionId,
            recipient_email: recipient.phone, // Using phone as identifier
            recipient_name: recipient.name,
            notification_type: `sms_${notificationType}`,
            status: 'sent',
          });
        }
      } catch (smsError) {
        console.error(`Error sending SMS to ${recipient.phone}:`, smsError);
        failedCount++;
      }
    }

    console.log(`SMS notification complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-sms-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);