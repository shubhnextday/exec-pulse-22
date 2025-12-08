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
  const maxTotal = Math.max(...customers.map(c => c.totalOrders));

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '900ms' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-success/10">
          <TrendingUp className="h-5 w-5 text-success" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">All Customers</h3>
          <p className="text-sm text-muted-foreground">By total order value ({customers.length} total)</p>
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
                  <p className="text-sm font-medium truncate max-w-[120px]">{customer.name}</p>
                </div>
                <span className="text-sm mono font-semibold">
                  ${(customer.totalOrders / 1000).toFixed(0)}k
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
    </div>
  );
}
