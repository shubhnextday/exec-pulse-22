import { cn } from '@/lib/utils';
import { LucideIcon, Info } from 'lucide-react';

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
  showInfo?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = 'text-primary',
  className,
  delay = 0,
  showInfo = false
}: MetricCardProps) {
  return (
    <div 
      className={cn(
        "metric-card opacity-0 animate-slide-up cursor-pointer",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            {showInfo && (
              <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
            )}
          </div>
          <p className="stat-value text-foreground">{value}</p>
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
          "icon-container",
          iconColor.includes('primary') && "icon-container-primary",
          iconColor.includes('secondary') && "icon-container-secondary",
          iconColor.includes('success') && "bg-success/10",
          iconColor.includes('warning') && "bg-warning/10",
          iconColor.includes('danger') && "bg-danger/10",
        )}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}
