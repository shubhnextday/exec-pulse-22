import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

interface OrderHealthChartProps {
  onTrack: number;
  atRisk: number;
  offTrack: number;
}

export function OrderHealthChart({ onTrack, atRisk, offTrack }: OrderHealthChartProps) {
  const data = [
    { name: 'On Track', value: onTrack, color: '#22c55e' },
    { name: 'At Risk', value: atRisk, color: '#F05323' },
    { name: 'Off Track', value: offTrack, color: '#ef4444' },
  ];

  const total = onTrack + atRisk + offTrack;

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
      
      <div className="h-[160px] relative px-5">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={68}
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
            <p className="text-2xl font-bold mono text-foreground">{total > 0 ? Math.round((onTrack / total) * 100) : 0}%</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Healthy</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 p-5 pt-3 border-t border-border/40 mx-5 mb-5">
        {data.map((item) => (
          <div key={item.name} className="text-center p-2 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.name}</span>
            </div>
            <p className="text-lg font-bold mono text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}