import { TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TopCustomersProps {
  customers: Array<{
    name: string;
    totalOrders: number;
    orderCount: number;
  }>;
}

export function TopCustomers({ customers }: TopCustomersProps) {
  const maxTotal = Math.max(...customers.map(c => c.totalOrders), 1);
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalOrders, 0);
  const totalOrderCount = customers.reduce((sum, c) => sum + c.orderCount, 0);

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '900ms' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-success/10">
          <TrendingUp className="h-5 w-5 text-success" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Top Customers</h3>
          <p className="text-sm text-muted-foreground">By total order value (from JIRA)</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-muted/30 border border-border/30">
        <div>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold mono">${(totalRevenue / 1000).toFixed(0)}k</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-lg font-bold mono">{totalOrderCount}</p>
        </div>
      </div>

      <ScrollArea className="h-[280px] pr-2">
        <div className="space-y-3">
          {customers.map((customer, index) => (
            <div key={customer.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium truncate max-w-[120px]" title={customer.name}>
                    {customer.name}
                  </p>
                </div>
                <span className="text-sm mono font-semibold">
                  ${customer.totalOrders >= 1000 ? (customer.totalOrders / 1000).toFixed(0) + 'k' : customer.totalOrders.toLocaleString()}
                </span>
              </div>
              <div className="ml-7 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-success to-primary transition-all duration-500 group-hover:opacity-80"
                  style={{ width: `${(customer.totalOrders / maxTotal) * 100}%` }}
                />
              </div>
              <div className="ml-7 mt-1">
                <span className="text-xs text-muted-foreground">{customer.orderCount} orders</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground text-center">
        Showing {customers.length} customers from filtered orders
      </div>
    </div>
  );
}