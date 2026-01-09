import { TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TopCustomersProps {
  customers: Array<{
    name: string;
    totalOrders: number;
    orderCount: number;
  }>;
}

export function TopCustomers({ customers }: TopCustomersProps) {
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalOrders, 0);
  const totalOrderCount = customers.reduce((sum, c) => sum + c.orderCount, 0);
  
  // Take top 10 for chart display
  const chartData = customers.slice(0, 10).map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
    fullName: c.name,
    revenue: c.totalOrders,
    orders: c.orderCount,
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '900ms' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="icon-container icon-container-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Customer Orders</h3>
          <p className="text-xs text-muted-foreground">Top customers by order value</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Quoted Orders Total</p>
          <p className="text-xl font-bold mono text-foreground">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Orders</p>
          <p className="text-xl font-bold mono text-foreground">{totalOrderCount}</p>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 ? (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string, props: { payload: { fullName: string; orders: number } }) => [
                  formatCurrency(value),
                  `${props.payload.fullName} (${props.payload.orders} orders)`
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ display: 'none' }}
              />
              <Bar 
                dataKey="revenue" 
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? 'hsl(var(--primary))' : `hsl(var(--primary) / ${1 - (index * 0.08)})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No customer data available</p>
        </div>
      )}

      {/* Full customer list */}
      <div className="mt-4 pt-3 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground mb-2">All {customers.length} customers</p>
        <ScrollArea className="h-[150px]">
          <div className="space-y-1.5 pr-2">
            {customers.map((customer, index) => (
              <div key={customer.name} className="flex items-center justify-between py-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="truncate max-w-[180px]" title={customer.name}>{customer.name}</span>
                </div>
                <span className="mono text-xs font-medium text-muted-foreground">{formatCurrency(customer.totalOrders)}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}