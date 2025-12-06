import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  email: string;
  name: string;
  approved: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, approved }: ApprovalEmailRequest = await req.json();

    console.log(`Sending ${approved ? 'approval' : 'rejection'} email to ${email}`);

    const subject = approved 
      ? "Your Voter Registration Has Been Approved!" 
      : "Update on Your Voter Registration";

    const htmlContent = approved
      ? `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 24px;">✓</span>
                </div>
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Registration Approved!</h1>
              </div>
              
              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                Dear ${name},
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                Great news! Your voter registration has been <strong style="color: #16a34a;">approved</strong>. You are now eligible to participate in active elections on our blockchain voting platform.
              </p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #166534; margin: 0; font-size: 14px;">
                  <strong>What's Next?</strong><br>
                  Log in to your account to view active elections and cast your vote securely.
                </p>
              </div>
              
              <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin: 0;">
                VoteChain - Secure Blockchain Voting
              </p>
            </div>
          </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Registration Update</h1>
              </div>
              
              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                Dear ${name},
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                We regret to inform you that your voter registration could not be approved at this time. This may be due to incomplete documentation or verification issues.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Need Help?</strong><br>
                  Please contact our support team for more information about your registration status.
                </p>
              </div>
              
              <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin: 0;">
                VoteChain - Secure Blockchain Voting
              </p>
            </div>
          </body>
        </html>
      `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "VoteChain <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const data = await emailResponse.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
