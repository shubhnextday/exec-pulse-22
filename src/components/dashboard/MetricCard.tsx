import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
  delay?: number;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = 'text-primary',
  className,
  delay = 0
}: MetricCardProps) {
  return (
    <div 
      className={cn(
        "metric-card opacity-0 animate-slide-up",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight mono">{value}</p>
          {change && (
            <p className={cn(
              "text-sm font-medium",
              change.isPositive ? "text-success" : "text-danger"
            )}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}% from last month
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl bg-primary/10",
          iconColor.includes('success') && "bg-success/10",
          iconColor.includes('warning') && "bg-warning/10",
          iconColor.includes('danger') && "bg-danger/10",
          iconColor.includes('accent') && "bg-accent/10",
        )}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </div>
    </div>
  );
}
