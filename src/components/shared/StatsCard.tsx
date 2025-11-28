import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'accent';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-primary/10 border-primary/20',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
  accent: 'bg-accent/10 border-accent/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  accent: 'bg-accent/20 text-accent',
};

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default', className }: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-6 transition-all duration-200 hover:shadow-lg',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {trend && (
            <p className={cn(
              'text-sm flex items-center gap-1',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-muted-foreground">vs last period</span>
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
