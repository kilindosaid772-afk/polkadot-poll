import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Vote, Users, UserCheck, 
  Settings, FileText, Box, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Vote, label: 'Elections', path: '/admin/elections' },
  { icon: Users, label: 'Candidates', path: '/admin/candidates' },
  { icon: UserCheck, label: 'Voters', path: '/admin/voters' },
  { icon: Box, label: 'Blockchain', path: '/admin/blockchain' },
  { icon: FileText, label: 'Audit Logs', path: '/admin/audit' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Vote className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-foreground">BlockVote Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-sidebar-foreground">System Admin</p>
            <p className="text-xs text-sidebar-foreground/60">admin@election.gov</p>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
