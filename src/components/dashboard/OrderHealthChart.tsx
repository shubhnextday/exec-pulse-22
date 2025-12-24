import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

interface OrderHealthChartProps {
  onTrack: number;
  atRisk: number;
  offTrack: number;
  complete: number;
  pendingDeposit: number;
  onHold: number;
  whiteLabel: number;
}

// Color palette matching Jira statuses
const HEALTH_COLORS = {
  'On Track': '#22c55e',      // Green
  'At Risk': '#eab308',       // Yellow/amber
  'Off Track': '#ef4444',     // Red
  'Complete': '#3b82f6',      // Blue
  'Pending Deposit': '#f97316', // Orange
  'On Hold': '#6b7280',       // Gray
  'White Label': '#8b5cf6',   // Purple
};

export function OrderHealthChart({ 
  onTrack, 
  atRisk, 
  offTrack, 
  complete, 
  pendingDeposit, 
  onHold, 
  whiteLabel 
}: OrderHealthChartProps) {
  const data = [
    { name: 'On Track', value: onTrack, color: HEALTH_COLORS['On Track'] },
    { name: 'At Risk', value: atRisk, color: HEALTH_COLORS['At Risk'] },
    { name: 'Off Track', value: offTrack, color: HEALTH_COLORS['Off Track'] },
    { name: 'Complete', value: complete, color: HEALTH_COLORS['Complete'] },
    { name: 'Pending Deposit', value: pendingDeposit, color: HEALTH_COLORS['Pending Deposit'] },
    { name: 'On Hold', value: onHold, color: HEALTH_COLORS['On Hold'] },
    { name: 'White Label', value: whiteLabel, color: HEALTH_COLORS['White Label'] },
  ].filter(item => item.value > 0); // Only show statuses with orders

  const total = onTrack + atRisk + offTrack + complete + pendingDeposit + onHold + whiteLabel;
  const healthyCount = onTrack + complete; // Consider on-track and complete as healthy

  return (
    <div className="metric-card opacity-0 animate-slide-up !p-0 overflow-hidden" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between p-5 pb-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-container-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Order Health</h3>
            <p className="text-xs text-muted-foreground">Current status breakdown</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/15 text-secondary border border-secondary/30">
          {total} orders
        </span>
      </div>
      
      <div className="flex items-center gap-4 px-5 pb-5 pt-2">
        {/* Pie Chart - Left Side */}
        <div className="h-[120px] w-[120px] relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0 0% 100%)', 
                  border: '1px solid hsl(0 0% 88%)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px hsl(0 0% 0% / 0.1)',
                }}
                labelStyle={{ color: 'hsl(0 0% 5%)' }}
                formatter={(value: number, name: string) => [
                  `${value} orders (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, 
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-lg font-bold mono text-foreground">{total}</p>
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        
        {/* Legend - Right Side */}
        <div className="flex-1 flex flex-col gap-1.5">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-semibold mono text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
