import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TurnoutAlertRequest {
  electionId: string;
  electionTitle: string;
  turnoutPercentage: number;
  threshold: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { electionId, electionTitle, turnoutPercentage, threshold }: TurnoutAlertRequest = await req.json();

    console.log(`Processing low turnout alert for election: ${electionTitle} (${turnoutPercentage}%)`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admins found to notify");
      return new Response(JSON.stringify({ message: "No admins to notify" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin profiles
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, name")
      .in("user_id", adminUserIds);

    if (profilesError) {
      console.error("Error fetching admin profiles:", profilesError);
      throw profilesError;
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const admin of adminProfiles || []) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert-box { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .header { background: #DC2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .stats { background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Low Voter Turnout Alert</h1>
            </div>
            <div class="alert-box">
              <h2>Attention Required</h2>
              <p>The voter turnout for <strong>${electionTitle}</strong> is below the expected threshold.</p>
            </div>
            <div class="stats">
              <p><strong>Current Turnout:</strong> ${turnoutPercentage.toFixed(1)}%</p>
              <p><strong>Alert Threshold:</strong> ${threshold}%</p>
            </div>
            <p>Consider sending reminders to voters or extending the voting period if necessary.</p>
            <div class="footer">
              <p>This is an automated alert from the SecureVote Election System.</p>
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
            from: "SecureVote Alerts <onboarding@resend.dev>",
            to: [admin.email],
            subject: `⚠️ Low Voter Turnout Alert: ${electionTitle}`,
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`Resend API error: ${emailResponse.status}`);
        }

        const emailData = await emailResponse.json();

        console.log(`Alert sent to ${admin.email}:`, emailData);

        await supabase.from("notification_logs").insert({
          election_id: electionId,
          recipient_email: admin.email,
          recipient_name: admin.name,
          notification_type: "turnout_alert",
          status: "sent",
        });

        sentCount++;
      } catch (emailError: any) {
        console.error(`Failed to send alert to ${admin.email}:`, emailError);

        await supabase.from("notification_logs").insert({
          election_id: electionId,
          recipient_email: admin.email,
          recipient_name: admin.name,
          notification_type: "turnout_alert",
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
    console.error("Error in send-turnout-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
