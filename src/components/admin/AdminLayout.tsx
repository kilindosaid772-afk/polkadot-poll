import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { BlockchainStatus } from '@/components/shared/BlockchainStatus';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  // Protection is now handled by ProtectedRoute in App.tsx
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <BlockchainStatus />
        </header>
        
        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
