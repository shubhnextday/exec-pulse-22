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
    <div className="chart-container opacity-0 animate-slide-up col-span-2" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Expected Cash Flow</h3>
          <p className="text-xs text-muted-foreground/70 mt-1">Projected revenue by ship date</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Expected</p>
          <p className="text-2xl font-bold text-primary mono">
            ${totalExpected.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5d7996" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#5d7996" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5d7996"/>
                <stop offset="100%" stopColor="#F05323"/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" vertical={false} />
            <XAxis 
              dataKey="formattedDate" 
              stroke="hsl(0 0% 50%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(0 0% 50%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(0 0% 100%)', 
                border: '1px solid hsl(0 0% 88%)',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: '0 4px 12px hsl(0 0% 0% / 0.1)',
              }}
              labelStyle={{ color: 'hsl(0 0% 5%)', fontWeight: 600, marginBottom: '4px' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Expected Revenue']}
            />
            <Area 
              type="monotone" 
              dataKey="expectedAmount" 
              stroke="#5d7996"
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorExpected)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
