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
        "metric-card opacity-0 animate-slide-up cursor-pointer group h-full",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between h-full min-h-[100px]">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">{title}</p>
            {showInfo && (
              <Info className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
            )}
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground mono">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium",
              change.isPositive ? "text-success" : "text-danger"
            )}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}% from last month
            </p>
          )}
        </div>
        <div className={cn(
          "icon-container transition-transform group-hover:scale-110 flex-shrink-0 self-center ml-3",
          iconColor.includes('primary') && "icon-container-primary",
          iconColor.includes('secondary') && "icon-container-secondary",
          iconColor.includes('success') && "bg-success/10 text-success",
          iconColor.includes('warning') && "bg-warning/10 text-warning",
          iconColor.includes('danger') && "bg-danger/10 text-danger",
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}