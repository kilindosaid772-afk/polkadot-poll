import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Shield, Loader2, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TwoFactorVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  userEmail: string;
}

export function TwoFactorVerification({
  open,
  onOpenChange,
  onVerified,
  userEmail,
}: TwoFactorVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (open && !codeSent) {
      sendVerificationCode();
    }
  }, [open]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationCode = async () => {
    setIsSending(true);
    try {
      const code = generateCode();
      setGeneratedCode(code);

      const { error } = await supabase.functions.invoke('send-2fa-code', {
        body: { 
          email: userEmail,
          code: code,
        },
      });

      if (error) throw error;

      setCodeSent(true);
      setCooldown(60);
      toast.success('Verification code sent to your email');
    } catch (error) {
      console.error('Error sending 2FA code:', error);
      // For demo purposes, still allow verification with the generated code
      setCodeSent(true);
      setCooldown(60);
      toast.info('Demo mode: Check console for verification code');
      console.log('Demo verification code:', generatedCode || generateCode());
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      // In production, verify against stored code
      // For demo, accept the generated code or "123456"
      if (otp === generatedCode || otp === '123456') {
        toast.success('Verification successful');
        onVerified();
        onOpenChange(false);
        setOtp('');
        setCodeSent(false);
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setOtp('');
    sendVerificationCode();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Two-Factor Verification</DialogTitle>
          <DialogDescription className="text-center">
            For your security, please verify your identity before casting your vote.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!codeSent ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                We'll send a verification code to:
              </p>
              <p className="font-medium mb-6">{userEmail}</p>
              <Button onClick={sendVerificationCode} disabled={isSending} className="w-full">
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to
                </p>
                <p className="font-medium">{userEmail}</p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleVerify}
                  disabled={otp.length !== 6 || isVerifying}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Demo mode: Use code <span className="font-mono">123456</span> for testing
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
