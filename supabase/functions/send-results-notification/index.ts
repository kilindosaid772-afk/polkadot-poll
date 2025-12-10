import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResultsNotificationRequest {
  electionId: string;
  electionTitle: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { electionId, electionTitle }: ResultsNotificationRequest = await req.json();

    console.log(`Sending results notification for election: ${electionTitle} (${electionId})`);

    // Get election results with candidates
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select("*")
      .eq("election_id", electionId)
      .order("vote_count", { ascending: false });

    if (candidatesError) throw candidatesError;

    const totalVotes = candidates?.reduce((sum, c) => sum + (c.vote_count || 0), 0) || 0;
    const winner = candidates?.[0];

    // Get all approved voters
    const { data: voters, error: votersError } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("is_approved", true);

    if (votersError) throw votersError;

    if (!voters || voters.length === 0) {
      console.log("No approved voters to notify");
      return new Response(JSON.stringify({ message: "No voters to notify" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build results table HTML
    const resultsTable = candidates
      ?.map((c, i) => {
        const percentage = totalVotes > 0 ? ((c.vote_count / totalVotes) * 100).toFixed(1) : "0";
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; text-align: center;">${i + 1}</td>
            <td style="padding: 12px;">${c.name}</td>
            <td style="padding: 12px;">${c.party}</td>
            <td style="padding: 12px; text-align: right;">${c.vote_count.toLocaleString()}</td>
            <td style="padding: 12px; text-align: right;">${percentage}%</td>
          </tr>
        `;
      })
      .join("");

    let successCount = 0;
    let failCount = 0;
    const notificationLogs: Array<{
      election_id: string;
      recipient_email: string;
      recipient_name: string | null;
      notification_type: string;
      status: string;
      error_message: string | null;
    }> = [];

    // Send emails to each voter
    for (const voter of voters) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Blockchain Voting <onboarding@resend.dev>",
            to: [voter.email],
            subject: `Election Results: ${electionTitle}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                  .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
                  .winner-box { background: #ECFDF5; border: 2px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th { background: #F3F4F6; padding: 12px; text-align: left; font-weight: 600; }
                  .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">Election Results</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">${electionTitle}</p>
                  </div>
                  <div class="content">
                    <p>Dear ${voter.name},</p>
                    <p>The election "${electionTitle}" has concluded. Here are the official results:</p>
                    
                    ${winner ? `
                    <div class="winner-box">
                      <p style="margin: 0; color: #10B981; font-weight: 600;">🏆 Winner</p>
                      <h2 style="margin: 10px 0 5px 0; color: #1F2937;">${winner.name}</h2>
                      <p style="margin: 0; color: #6B7280;">${winner.party} • ${winner.vote_count.toLocaleString()} votes</p>
                    </div>
                    ` : ''}
                    
                    <table>
                      <thead>
                        <tr>
                          <th style="text-align: center;">Rank</th>
                          <th>Candidate</th>
                          <th>Party</th>
                          <th style="text-align: right;">Votes</th>
                          <th style="text-align: right;">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${resultsTable}
                      </tbody>
                    </table>
                    
                    <p style="margin-top: 20px; color: #6B7280;">
                      <strong>Total Votes Cast:</strong> ${totalVotes.toLocaleString()}
                    </p>
                    
                    <p style="margin-top: 20px;">
                      Thank you for participating in our democratic process. All votes have been securely recorded on the blockchain.
                    </p>
                    
                    <div class="footer">
                      <p>This is an automated notification from the Blockchain Voting System.</p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          successCount++;
          console.log(`Email sent to ${voter.email}`);
          notificationLogs.push({
            election_id: electionId,
            recipient_email: voter.email,
            recipient_name: voter.name,
            notification_type: 'results',
            status: 'sent',
            error_message: null,
          });
        } else {
          const errorText = await response.text();
          failCount++;
          console.error(`Failed to send to ${voter.email}:`, errorText);
          notificationLogs.push({
            election_id: electionId,
            recipient_email: voter.email,
            recipient_name: voter.name,
            notification_type: 'results',
            status: 'failed',
            error_message: errorText,
          });
        }
      } catch (emailError: any) {
        failCount++;
        console.error(`Error sending to ${voter.email}:`, emailError);
        notificationLogs.push({
          election_id: electionId,
          recipient_email: voter.email,
          recipient_name: voter.name,
          notification_type: 'results',
          status: 'failed',
          error_message: emailError.message || 'Unknown error',
        });
      }
    }

    // Insert notification logs into database
    if (notificationLogs.length > 0) {
      const { error: logError } = await supabase
        .from('notification_logs')
        .insert(notificationLogs);
      
      if (logError) {
        console.error('Failed to save notification logs:', logError);
      } else {
        console.log(`Saved ${notificationLogs.length} notification logs`);
      }
    }

    console.log(`Results notification complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        total: voters.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-results-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
