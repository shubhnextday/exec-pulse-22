import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CashFlowProjection } from '@/types/dashboard';
import { format, parseISO } from 'date-fns';

interface CashFlowChartProps {
  data: CashFlowProjection[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const chartData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM d'),
  }));

  const totalExpected = data.reduce((sum, item) => sum + item.expectedAmount, 0);

  return (
    <div className="metric-card opacity-0 animate-slide-up col-span-2" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Expected Cash Flow</h3>
          <p className="text-sm text-muted-foreground">Projected revenue by ship date</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Expected</p>
          <p className="text-2xl font-bold text-primary mono">
            ${totalExpected.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 16%)" />
            <XAxis 
              dataKey="formattedDate" 
              stroke="hsl(215 20% 55%)"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(215 20% 55%)"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 10%)', 
                border: '1px solid hsl(222 47% 16%)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(210 40% 96%)' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Expected']}
            />
            <Area 
              type="monotone" 
              dataKey="expectedAmount" 
              stroke="hsl(199 89% 48%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorExpected)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
