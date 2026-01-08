import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CashFlowProjection } from '@/types/dashboard';
import { format, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface CashFlowChartProps {
  data: CashFlowProjection[];
}

// Custom dot component for the line
const CustomDot = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  
  return (
    <g>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={8} fill="hsl(var(--primary))" opacity={0.2} />
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
    </g>
  );
};

export function CashFlowChart({ data }: CashFlowChartProps) {
  const chartData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM d'),
  }));

  const totalExpected = data.reduce((sum, item) => sum + item.expectedAmount, 0);

  return (
    <div className="metric-card opacity-0 animate-slide-up col-span-2 !p-0 overflow-hidden" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between p-5 pb-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-container-secondary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Expected Cash Flow</h3>
            <p className="text-xs text-muted-foreground">Projected revenue by ship date</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Total Expected</p>
          <p className="text-2xl font-bold text-primary mono">
            ${totalExpected.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="h-[240px] px-5 pb-5 pt-4">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No outstanding payments for selected filter</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorExpectedGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <XAxis 
                dataKey="formattedDate" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                dx={-5}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 24px hsl(var(--primary) / 0.15)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Expected Revenue']}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="expectedAmount" 
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorExpectedGlow)"
                filter="url(#glow)"
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}