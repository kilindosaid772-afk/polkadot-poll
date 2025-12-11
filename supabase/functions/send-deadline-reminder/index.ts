import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeadlineReminderRequest {
  electionId: string;
  electionTitle: string;
  endDate: string;
  hoursRemaining: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { electionId, electionTitle, endDate, hoursRemaining }: DeadlineReminderRequest = await req.json();

    console.log(`Processing deadline reminder for election: ${electionTitle} (${hoursRemaining}h remaining)`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get voters who are approved but haven't voted yet
    const { data: voters, error: votersError } = await supabase
      .from("profiles")
      .select("email, name, user_id")
      .eq("is_approved", true)
      .eq("has_voted", false);

    if (votersError) {
      console.error("Error fetching voters:", votersError);
      throw votersError;
    }

    if (!voters || voters.length === 0) {
      console.log("No eligible voters to remind");
      return new Response(JSON.stringify({ message: "No voters to remind" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedEndDate = new Date(endDate).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let sentCount = 0;
    let failedCount = 0;

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
            .deadline-box { background: #FEE2E2; border: 2px solid #EF4444; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
            .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🗳️ Voting Deadline Reminder</h1>
            </div>
            <div class="content">
              <p>Dear ${voter.name},</p>
              <p>This is a friendly reminder that the <strong>${electionTitle}</strong> election is closing soon!</p>
              
              <div class="deadline-box">
                <h2 style="margin: 0; color: #DC2626;">⏰ Only ${hoursRemaining} hours remaining!</h2>
                <p style="margin: 10px 0 0 0;">Voting ends: ${formattedEndDate}</p>
              </div>
              
              <p>Your vote matters! Make sure to cast your vote before the deadline.</p>
              
              <p style="text-align: center;">
                <a href="#" class="cta-button">Vote Now</a>
              </p>
              
              <div class="footer">
                <p>This is an automated reminder from the SecureVote Election System.</p>
                <p>If you have already voted, please disregard this message.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "SecureVote <onboarding@resend.dev>",
            to: [voter.email],
            subject: `⏰ Reminder: ${hoursRemaining}h left to vote in ${electionTitle}`,
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`Resend API error: ${emailResponse.status}`);
        }

        const emailData = await emailResponse.json();

        console.log(`Reminder sent to ${voter.email}:`, emailData);

        await supabase.from("notification_logs").insert({
          election_id: electionId,
          recipient_email: voter.email,
          recipient_name: voter.name,
          notification_type: "deadline_reminder",
          status: "sent",
        });

        sentCount++;
      } catch (emailError: any) {
        console.error(`Failed to send reminder to ${voter.email}:`, emailError);

        await supabase.from("notification_logs").insert({
          election_id: electionId,
          recipient_email: voter.email,
          recipient_name: voter.name,
          notification_type: "deadline_reminder",
          status: "failed",
          error_message: emailError.message,
        });

        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({ sent: sentCount, failed: failedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-deadline-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
