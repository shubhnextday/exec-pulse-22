import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
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
  // Exclude 'Complete' from pie chart
  const data = [
    { name: 'On Track', value: onTrack, color: HEALTH_COLORS['On Track'] },
    { name: 'At Risk', value: atRisk, color: HEALTH_COLORS['At Risk'] },
    { name: 'Off Track', value: offTrack, color: HEALTH_COLORS['Off Track'] },
    { name: 'Pending Deposit', value: pendingDeposit, color: HEALTH_COLORS['Pending Deposit'] },
    { name: 'On Hold', value: onHold, color: HEALTH_COLORS['On Hold'] },
    { name: 'White Label', value: whiteLabel, color: HEALTH_COLORS['White Label'] },
  ].filter(item => item.value > 0);

  // Total excludes complete orders for the pie chart
  const total = onTrack + atRisk + offTrack + pendingDeposit + onHold + whiteLabel;

  return (
    <div className="metric-card opacity-0 animate-slide-up !p-0 overflow-hidden" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between p-5 pb-2">
        <h3 className="text-base font-semibold text-foreground">Order Health</h3>
        <span className="text-xs text-muted-foreground border border-border rounded-md px-2 py-1">
          Current Status
        </span>
      </div>
      
      <div className="flex flex-col items-center px-5 pb-4">
        {/* Pie Chart with center label */}
        <div className="h-[220px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
                label={({ cx, cy, midAngle, outerRadius, percent }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 18;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="hsl(var(--muted-foreground))"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize={10}
                      fontWeight={500}
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                labelLine={{
                  stroke: 'hsl(var(--border))',
                  strokeWidth: 1,
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 8}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 12}
                            className="fill-muted-foreground text-xs"
                          >
                            Orders
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0 0% 100%)', 
                  border: '1px solid hsl(0 0% 88%)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px hsl(0 0% 0% / 0.1)',
                }}
                formatter={(value: number, name: string) => [
                  `${value} orders`, 
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend - Bottom */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}