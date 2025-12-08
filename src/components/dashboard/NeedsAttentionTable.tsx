import { Order, OrderHealth } from '@/types/dashboard';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NeedsAttentionTableProps {
  orders: Order[];
}

function HealthBadge({ health }: { health: OrderHealth }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
      health === 'on-track' && "status-on-track",
      health === 'at-risk' && "status-at-risk",
      health === 'off-track' && "status-off-track",
    )}>
      {health === 'at-risk' && <AlertTriangle className="h-3 w-3" />}
      {health === 'off-track' && <AlertTriangle className="h-3 w-3" />}
      {health.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr 
        className="cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3.5 border-t border-border/30">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <HealthBadge health={order.orderHealth} />
          </div>
        </td>
        <td className="px-4 py-3.5 border-t border-border/30 font-medium text-foreground">
          {order.customer}
        </td>
        <td className="px-4 py-3.5 border-t border-border/30 text-muted-foreground max-w-[180px] truncate">
          {order.productName}
        </td>
        <td className="px-4 py-3.5 border-t border-border/30 mono text-sm">
          {order.salesOrderNumber}
        </td>
        <td className="px-4 py-3.5 border-t border-border/30">
          <span className="text-sm">{order.currentStatus}</span>
        </td>
        <td className="px-4 py-3.5 border-t border-border/30">
          <span className="text-sm text-muted-foreground">{order.expectedStatus}</span>
        </td>
        <td className="px-4 py-3.5 border-t border-border/30">
          <span className={cn(
            "mono text-sm font-medium",
            order.daysBehindSchedule > 0 && "text-danger"
          )}>
            {order.daysBehindSchedule > 0 ? `-${order.daysBehindSchedule}` : '0'} days
          </span>
        </td>
        <td className="px-4 py-3.5 border-t border-border/30 text-sm">
          {order.estShipDate}
        </td>
        <td className="px-4 py-3.5 border-t border-border/30 mono text-sm">
          {order.quantityOrdered.toLocaleString()}
        </td>
      </tr>
      {expanded && order.orderNotes && (
        <tr>
          <td colSpan={9} className="px-4 py-3.5 bg-muted/20 border-t border-border/30">
            <div className="ml-6 p-3 rounded-xl bg-card border border-border/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Order Notes:</p>
              <p className="text-sm text-foreground">{order.orderNotes}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function NeedsAttentionTable({ orders }: NeedsAttentionTableProps) {
  const attentionOrders = orders.filter(
    o => o.orderHealth === 'at-risk' || o.orderHealth === 'off-track'
  ).sort((a, b) => {
    if (a.orderHealth === 'off-track' && b.orderHealth !== 'off-track') return -1;
    if (a.orderHealth !== 'off-track' && b.orderHealth === 'off-track') return 1;
    return b.daysBehindSchedule - a.daysBehindSchedule;
  });

  return (
    <div className="metric-card opacity-0 animate-slide-up !p-0 overflow-hidden" style={{ animationDelay: '500ms' }}>
      <div className="p-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="icon-container bg-danger/10 text-danger">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Needs Attention</h3>
            <p className="text-xs text-muted-foreground">
              {attentionOrders.length} orders requiring immediate review
            </p>
          </div>
        </div>
      </div>
      
      {attentionOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground">All Orders On Track</p>
          <p className="text-xs text-muted-foreground">No orders need attention</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[140px]">Health</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Sales Order #</th>
                  <th>Current Status</th>
                  <th>Expected Status</th>
                  <th>Behind Schedule</th>
                  <th>Est. Ship Date</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {attentionOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}