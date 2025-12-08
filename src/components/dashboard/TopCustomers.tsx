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
      <div className="flex items-center gap-3 mb-5">
        <div className="icon-container icon-container-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Customer Orders</h3>
          <p className="text-xs text-muted-foreground">By total order value</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-xl font-bold mono text-foreground">${(totalRevenue / 1000).toFixed(0)}k</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Orders</p>
          <p className="text-xl font-bold mono text-foreground">{totalOrderCount}</p>
        </div>
      </div>

      <ScrollArea className="h-[240px] pr-2">
        <div className="space-y-3">
          {customers.map((customer, index) => (
            <div key={customer.name} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium truncate max-w-[140px]" title={customer.name}>
                    {customer.name}
                  </p>
                </div>
                <span className="text-sm mono font-semibold text-foreground">
                  ${customer.totalOrders >= 1000 ? (customer.totalOrders / 1000).toFixed(0) + 'k' : customer.totalOrders.toLocaleString()}
                </span>
              </div>
              <div className="ml-8 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 group-hover:from-primary group-hover:to-primary/80"
                  style={{ width: `${(customer.totalOrders / maxTotal) * 100}%` }}
                />
              </div>
              <div className="ml-8 mt-1">
                <span className="text-[11px] text-muted-foreground">{customer.orderCount} orders</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground text-center">
        {customers.length} customers from filtered orders
      </div>
    </div>
  );
}