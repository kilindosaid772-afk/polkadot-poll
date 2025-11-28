import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Vote, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [loginType, setLoginType] = useState<'voter' | 'admin'>('voter');
  
  const { login, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password, loginType);
      
      if (success) {
        if (loginType === 'admin') {
          toast.success('Welcome back, Admin!');
          navigate('/admin');
        } else {
          setShowOTP(true);
          toast.info('OTP sent to your registered phone number');
        }
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    setIsLoading(true);
    try {
      const success = await verifyOTP(otp);
      if (success) {
        toast.success('Login successful!');
        navigate('/voter');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (showOTP) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
              <button 
                onClick={() => setShowOTP(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
              
              <div className="text-center mb-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Verify Your Identity</h1>
                <p className="text-muted-foreground mt-2">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>

              <div className="flex justify-center mb-8">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleOTPVerify}
                disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify & Login'
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Didn't receive the code?{' '}
                <button className="text-primary hover:underline">Resend</button>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Vote className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-muted-foreground mt-2">Sign in to access your account</p>
            </div>

            <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'voter' | 'admin')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voter">Voter</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={loginType === 'admin' ? 'admin@election.gov' : 'voter@email.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a href="#" className="text-primary hover:underline">Forgot password?</a>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {loginType === 'voter' && (
              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">Register to vote</Link>
              </p>
            )}

            {loginType === 'admin' && (
              <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">
                  <strong>Demo credentials:</strong><br />
                  Email: admin@election.gov<br />
                  Password: admin123
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
