import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Vote, LogOut, User, Shield, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Vote className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold gradient-text">BlockVote</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/elections" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Elections
          </Link>
          <Link to="/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Verify Vote
          </Link>
          <Link to="/explorer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Explorer
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  <span className="hidden sm:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(isAdmin ? '/admin' : '/voter')}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button onClick={() => navigate('/register')}>
                Register
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border/40 py-4">
          <div className="container flex flex-col gap-2">
            <Link to="/" className="py-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/elections" className="py-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Elections
            </Link>
            <Link to="/verify" className="py-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Verify Vote
            </Link>
            <Link to="/explorer" className="py-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              Explorer
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
