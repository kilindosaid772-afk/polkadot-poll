import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting scheduled notification check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    
    // Get all active elections
    const { data: elections, error: electionsError } = await supabase
      .from("elections")
      .select("*")
      .eq("status", "active");

    if (electionsError) {
      console.error("Error fetching elections:", electionsError);
      throw electionsError;
    }

    if (!elections || elections.length === 0) {
      console.log("No active elections found");
      return new Response(JSON.stringify({ message: "No active elections" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const election of elections) {
      const endDate = new Date(election.end_date);
      const hoursRemaining = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      console.log(`Election "${election.title}" ends in ${hoursRemaining} hours`);

      // Check if we should send 24h reminder
      if (hoursRemaining <= 24 && hoursRemaining > 22) {
        const shouldSend = await checkIfReminderNeeded(supabase, election.id, "24h");
        if (shouldSend) {
          await sendReminders(supabase, election, 24);
          results.push({ election: election.title, reminder: "24h" });
        }
      }
      
      // Check if we should send 2h reminder
      if (hoursRemaining <= 2 && hoursRemaining > 0) {
        const shouldSend = await checkIfReminderNeeded(supabase, election.id, "2h");
        if (shouldSend) {
          await sendReminders(supabase, election, 2);
          results.push({ election: election.title, reminder: "2h" });
        }
      }

      // Check turnout and send alerts if below threshold
      const { data: voters } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_approved", true);

      const totalVoters = voters?.length || 0;
      const turnoutPercent = totalVoters > 0 ? (election.total_votes / totalVoters) * 100 : 0;

      // If turnout is below 30% and less than 12 hours remaining, send alert
      if (turnoutPercent < 30 && hoursRemaining <= 12 && hoursRemaining > 0) {
        const shouldSend = await checkIfAlertNeeded(supabase, election.id, "low_turnout_auto");
        if (shouldSend) {
          await sendTurnoutAlert(supabase, election, turnoutPercent);
          results.push({ election: election.title, alert: "low_turnout", turnout: turnoutPercent.toFixed(1) });
        }
      }
    }

    console.log("Scheduled notification check completed:", results);

    return new Response(JSON.stringify({ processed: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in check-scheduled-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function checkIfReminderNeeded(supabase: any, electionId: string, type: string): Promise<boolean> {
  const since = new Date();
  since.setHours(since.getHours() - 3); // Check if reminder was sent in last 3 hours

  const { data } = await supabase
    .from("notification_logs")
    .select("id")
    .eq("election_id", electionId)
    .eq("notification_type", `deadline_reminder_${type}`)
    .gte("sent_at", since.toISOString())
    .limit(1);

  return !data || data.length === 0;
}

async function checkIfAlertNeeded(supabase: any, electionId: string, type: string): Promise<boolean> {
  const since = new Date();
  since.setHours(since.getHours() - 6); // Check if alert was sent in last 6 hours

  const { data } = await supabase
    .from("notification_logs")
    .select("id")
    .eq("election_id", electionId)
    .eq("notification_type", type)
    .gte("sent_at", since.toISOString())
    .limit(1);

  return !data || data.length === 0;
}

async function sendReminders(supabase: any, election: any, hoursRemaining: number): Promise<void> {
  console.log(`Sending ${hoursRemaining}h reminders for election: ${election.title}`);

  const { data: voters } = await supabase
    .from("profiles")
    .select("email, name")
    .eq("is_approved", true)
    .eq("has_voted", false);

  if (!voters || voters.length === 0) {
    console.log("No voters to remind");
    return;
  }

  const formattedEndDate = new Date(election.end_date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  for (const voter of voters) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #F9FAFB; padding: 20px; border-radius: 0 0 8px 8px; }
          .deadline-box { background: ${hoursRemaining <= 2 ? '#FEE2E2' : '#FEF3C7'}; border: 2px solid ${hoursRemaining <= 2 ? '#EF4444' : '#F59E0B'}; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🗳️ ${hoursRemaining <= 2 ? 'URGENT: ' : ''}Voting Deadline Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${voter.name},</p>
            <p>This is ${hoursRemaining <= 2 ? 'an <strong>urgent</strong>' : 'a friendly'} reminder that the <strong>${election.title}</strong> election is closing ${hoursRemaining <= 2 ? 'very soon' : 'tomorrow'}!</p>
            
            <div class="deadline-box">
              <h2 style="margin: 0; color: ${hoursRemaining <= 2 ? '#DC2626' : '#D97706'};">⏰ Only ${hoursRemaining} hours remaining!</h2>
              <p style="margin: 10px 0 0 0;">Voting ends: ${formattedEndDate}</p>
            </div>
            
            <p>Your vote matters! Make sure to cast your vote before the deadline.</p>
            
            <div class="footer">
              <p>This is an automated reminder from the SecureVote Election System.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "SecureVote <onboarding@resend.dev>",
          to: [voter.email],
          subject: `${hoursRemaining <= 2 ? '🚨 URGENT: ' : '⏰ Reminder: '}${hoursRemaining}h left to vote in ${election.title}`,
          html: htmlContent,
        }),
      });

      await supabase.from("notification_logs").insert({
        election_id: election.id,
        recipient_email: voter.email,
        recipient_name: voter.name,
        notification_type: `deadline_reminder_${hoursRemaining}h`,
        status: "sent",
      });
    } catch (error: any) {
      console.error(`Failed to send reminder to ${voter.email}:`, error);
    }
  }
}

async function sendTurnoutAlert(supabase: any, election: any, turnoutPercent: number): Promise<void> {
  console.log(`Sending low turnout alert for election: ${election.title} (${turnoutPercent.toFixed(1)}%)`);

  // Get admin users
  const { data: adminRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (!adminRoles || adminRoles.length === 0) {
    console.log("No admins found");
    return;
  }

  for (const adminRole of adminRoles) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("user_id", adminRole.user_id)
      .single();

    if (!profile) continue;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #F9FAFB; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #FEE2E2; border: 2px solid #EF4444; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
          .stat { font-size: 48px; font-weight: bold; color: #DC2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⚠️ Low Voter Turnout Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${profile.name},</p>
            <p>This is an <strong>automatic alert</strong> regarding low voter turnout for the <strong>${election.title}</strong> election.</p>
            
            <div class="alert-box">
              <p style="margin: 0;">Current Turnout</p>
              <p class="stat">${turnoutPercent.toFixed(1)}%</p>
              <p style="margin: 0; color: #6B7280;">Total votes: ${election.total_votes}</p>
            </div>
            
            <p>Consider sending additional reminders to voters or extending outreach efforts.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "SecureVote <onboarding@resend.dev>",
          to: [profile.email],
          subject: `⚠️ Low Turnout Alert: ${election.title} at ${turnoutPercent.toFixed(1)}%`,
          html: htmlContent,
        }),
      });

      await supabase.from("notification_logs").insert({
        election_id: election.id,
        recipient_email: profile.email,
        recipient_name: profile.name,
        notification_type: "low_turnout_auto",
        status: "sent",
      });
    } catch (error: any) {
      console.error(`Failed to send alert to ${profile.email}:`, error);
    }
  }
}

serve(handler);
