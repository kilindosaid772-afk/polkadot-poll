import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwoFactorRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: TwoFactorRequest = await req.json();

    console.log(`Sending 2FA code to ${email}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ChainVote <onboarding@resend.dev>",
        to: [email],
        subject: "Your ChainVote Verification Code",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0f1a; color: #e2e8f0; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #131a2e 0%, #0f1524 100%); border-radius: 16px; padding: 40px; border: 1px solid #1e293b;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; padding: 12px; background: rgba(14, 165, 233, 0.1); border-radius: 12px; margin-bottom: 16px;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m9 12 2 2 4-4"/>
                    <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9z"/>
                  </svg>
                </div>
                <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #0ea5e9;">ChainVote</h1>
              </div>
              
              <h2 style="font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 16px; color: #e2e8f0;">Verification Code</h2>
              
              <p style="color: #94a3b8; text-align: center; margin-bottom: 24px;">
                Use this code to verify your identity before casting your vote:
              </p>
              
              <div style="background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.2); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0ea5e9; font-family: monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #94a3b8; text-align: center; font-size: 14px; margin-bottom: 24px;">
                This code will expire in 10 minutes. Do not share this code with anyone.
              </p>
              
              <div style="border-top: 1px solid #1e293b; padding-top: 24px; text-align: center;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">
                  If you didn't request this code, please ignore this email.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const data = await emailResponse.json();
    console.log("2FA email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-2fa-code function:", error);
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
