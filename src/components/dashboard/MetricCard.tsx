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
  delay = 0,
}: MetricCardProps) {
  return (
    <div 
      className={cn(
        "metric-card opacity-0 animate-slide-up cursor-pointer group relative overflow-hidden",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Blended background icon */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.08] transition-transform duration-300 group-hover:scale-110 group-hover:opacity-[0.12]">
        <Icon className="h-28 w-28" strokeWidth={1.5} />
      </div>
      
      <div className="relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
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
      </div>
    </div>
  );
}
