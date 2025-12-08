import { Order, OrderHealth } from '@/types/dashboard';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
        className="cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <HealthBadge health={order.orderHealth} />
          </div>
        </td>
        <td className="px-4 py-3 border-t border-border/30 font-medium">
          {order.customer}
        </td>
        <td className="px-4 py-3 border-t border-border/30 text-muted-foreground">
          {order.productName}
        </td>
        <td className="px-4 py-3 border-t border-border/30 mono text-sm">
          {order.salesOrderNumber}
        </td>
        <td className="px-4 py-3 border-t border-border/30">
          <span className="text-sm">{order.currentStatus}</span>
        </td>
        <td className="px-4 py-3 border-t border-border/30">
          <span className="text-sm text-muted-foreground">{order.expectedStatus}</span>
        </td>
        <td className="px-4 py-3 border-t border-border/30">
          <span className={cn(
            "mono text-sm font-medium",
            order.daysBehindSchedule > 0 && "text-danger"
          )}>
            {order.daysBehindSchedule > 0 ? `-${order.daysBehindSchedule}` : '0'} days
          </span>
        </td>
        <td className="px-4 py-3 border-t border-border/30 text-sm">
          {order.estShipDate}
        </td>
        <td className="px-4 py-3 border-t border-border/30 mono text-sm">
          {order.quantityOrdered.toLocaleString()}
        </td>
      </tr>
      {expanded && order.orderNotes && (
        <tr>
          <td colSpan={9} className="px-4 py-3 bg-muted/10 border-t border-border/30">
            <div className="ml-6 p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Order Notes:</p>
              <p className="text-sm">{order.orderNotes}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function NeedsAttentionTable({ orders }: NeedsAttentionTableProps) {
  // Include at-risk, off-track, and pending orders
  const attentionOrders = orders.filter(o => {
    const status = o.currentStatus?.toLowerCase() || '';
    const isPending = status.includes('pending') || status.includes('waiting') || status.includes('blocked');
    return o.orderHealth === 'at-risk' || o.orderHealth === 'off-track' || isPending;
  }).sort((a, b) => {
    // Priority: off-track > at-risk > pending
    if (a.orderHealth === 'off-track' && b.orderHealth !== 'off-track') return -1;
    if (a.orderHealth !== 'off-track' && b.orderHealth === 'off-track') return 1;
    if (a.orderHealth === 'at-risk' && b.orderHealth !== 'at-risk') return -1;
    if (a.orderHealth !== 'at-risk' && b.orderHealth === 'at-risk') return 1;
    return b.daysBehindSchedule - a.daysBehindSchedule;
  });

  return (
    <div className="metric-card opacity-0 animate-slide-up p-0 overflow-hidden" style={{ animationDelay: '500ms' }}>
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Needs Attention</h3>
            <p className="text-sm text-muted-foreground">
              {attentionOrders.length} orders requiring immediate review
            </p>
          </div>
        </div>
      </div>
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
    </div>
  );
}
