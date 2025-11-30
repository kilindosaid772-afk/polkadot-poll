import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireApproval?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireApproval = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/voter" replace />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (requireApproval && profile && !profile.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Pending Approval</h1>
          <p className="text-muted-foreground mb-6">
            Your voter registration is pending approval from an administrator. 
            You will be able to vote once your account is approved.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
