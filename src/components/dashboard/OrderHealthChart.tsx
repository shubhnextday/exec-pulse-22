import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OrderHealthChartProps {
  onTrack: number;
  atRisk: number;
  offTrack: number;
}

export function OrderHealthChart({ onTrack, atRisk, offTrack }: OrderHealthChartProps) {
  const data = [
    { name: 'On Track', value: onTrack, color: '#22c55e' },      // Green
    { name: 'At Risk', value: atRisk, color: '#F05323' },        // Brand Orange
    { name: 'Off Track', value: offTrack, color: '#ef4444' },    // Red
  ];

  const total = onTrack + atRisk + offTrack;

  return (
    <div className="chart-container opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order Health</h3>
        <span className="badge-secondary">{total} orders</span>
      </div>
      <div className="h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
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
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/30">
        {data.map((item) => (
          <div key={item.name} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
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
