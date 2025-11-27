import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface OrderHealthChartProps {
  onTrack: number;
  atRisk: number;
  offTrack: number;
}

export function OrderHealthChart({ onTrack, atRisk, offTrack }: OrderHealthChartProps) {
  const data = [
    { name: 'On Track', value: onTrack, color: 'hsl(142 76% 36%)' },
    { name: 'At Risk', value: atRisk, color: 'hsl(38 92% 50%)' },
    { name: 'Off Track', value: offTrack, color: 'hsl(0 72% 51%)' },
  ];

  const total = onTrack + atRisk + offTrack;

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <h3 className="text-lg font-semibold mb-4">Order Health Distribution</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 10%)', 
                border: '1px solid hsl(222 47% 16%)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(210 40% 96%)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
            <p className="text-lg font-semibold mono mt-1">
              {Math.round((item.value / total) * 100)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
