import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import type { Order } from '@/types/dashboard';

interface OrderHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

// Color configuration for each health status
const HEALTH_CONFIG = {
  'on-track': { label: 'ON TRACK', color: 'emerald', bgClass: 'bg-emerald-500/15', borderClass: 'border-emerald-500/40', textClass: 'text-emerald-600', countClass: 'text-emerald-600' },
  'at-risk': { label: 'AT RISK', color: 'amber', bgClass: 'bg-amber-500/15', borderClass: 'border-amber-500/40', textClass: 'text-amber-600', countClass: 'text-amber-600' },
  'off-track': { label: 'OFF TRACK', color: 'red', bgClass: 'bg-red-500/15', borderClass: 'border-red-500/40', textClass: 'text-red-600', countClass: 'text-red-600' },
  'complete': { label: 'COMPLETE', color: 'blue', bgClass: 'bg-blue-500/15', borderClass: 'border-blue-500/40', textClass: 'text-blue-600', countClass: 'text-blue-600' },
  'pending-deposit': { label: 'PENDING DEPOSIT', color: 'orange', bgClass: 'bg-orange-500/15', borderClass: 'border-orange-500/40', textClass: 'text-orange-600', countClass: 'text-orange-600' },
  'on-hold': { label: 'ON HOLD', color: 'gray', bgClass: 'bg-gray-500/15', borderClass: 'border-gray-500/40', textClass: 'text-gray-600', countClass: 'text-gray-600' },
  'white-label': { label: 'WHITE LABEL', color: 'violet', bgClass: 'bg-violet-500/15', borderClass: 'border-violet-500/40', textClass: 'text-violet-600', countClass: 'text-violet-600' },
};

type HealthKey = keyof typeof HEALTH_CONFIG;

export function OrderHealthDialog({ open, onOpenChange, orders }: OrderHealthDialogProps) {
  // Group orders by health status
  const ordersByHealth: Record<HealthKey, Order[]> = {
    'on-track': orders.filter(o => o.orderHealth === 'on-track'),
    'at-risk': orders.filter(o => o.orderHealth === 'at-risk'),
    'off-track': orders.filter(o => o.orderHealth === 'off-track'),
    'complete': orders.filter(o => o.orderHealth === 'complete'),
    'pending-deposit': orders.filter(o => o.orderHealth === 'pending-deposit'),
    'on-hold': orders.filter(o => o.orderHealth === 'on-hold'),
    'white-label': orders.filter(o => o.orderHealth === 'white-label'),
  };

  // Get statuses that have orders (for tabs)
  const activeStatuses = (Object.keys(ordersByHealth) as HealthKey[])
    .filter(status => ordersByHealth[status].length > 0);

  // Default to first active status, preferring off-track > at-risk > on-track
  const getDefaultTab = (): HealthKey => {
    if (ordersByHealth['off-track'].length > 0) return 'off-track';
    if (ordersByHealth['at-risk'].length > 0) return 'at-risk';
    if (activeStatuses.length > 0) return activeStatuses[0];
    return 'on-track';
  };

  const [selectedTab, setSelectedTab] = useState<HealthKey>(getDefaultTab());

  const OrderTable = ({ orderList }: { orderList: Order[] }) => (
    <ScrollArea className="h-[40vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Sales Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Days Behind</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderList.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.salesOrderNumber || '-'}</TableCell>
              <TableCell>{order.customer}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={order.productName}>{order.productName || '-'}</TableCell>
              <TableCell>{order.currentStatus}</TableCell>
              <TableCell>
                {order.daysBehindSchedule > 0 ? (
                  <span className="text-red-600">{order.daysBehindSchedule} days</span>
                ) : (
                  <span className="text-emerald-600">On time</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${order.orderTotal?.toLocaleString() || '0'}
              </TableCell>
            </TableRow>
          ))}
          {orderList.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No orders in this category
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Order Health Breakdown
          </DialogTitle>
        </DialogHeader>
        
        {/* Status summary cards - all 7 statuses */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {(Object.entries(HEALTH_CONFIG) as [HealthKey, typeof HEALTH_CONFIG[HealthKey]][]).map(([key, config]) => {
            const count = ordersByHealth[key].length;
            return (
              <div 
                key={key} 
                className={`p-3 rounded-lg border text-center cursor-pointer transition-all hover:scale-105 ${config.bgClass} ${config.borderClass} ${selectedTab === key ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                onClick={() => setSelectedTab(key)}
              >
                <div className={`text-[9px] font-semibold uppercase tracking-wider ${config.textClass} leading-tight min-h-[24px] flex items-center justify-center`}>
                  {config.label}
                </div>
                <div className={`text-2xl font-bold ${config.countClass}`}>{count}</div>
              </div>
            );
          })}
        </div>
        
        {/* Filter tabs - show all statuses to match widget */}
        <div className="flex gap-2 border-b border-border pb-2 mb-4 flex-wrap">
          {(Object.keys(HEALTH_CONFIG) as HealthKey[]).map((status) => {
            const config = HEALTH_CONFIG[status];
            const count = ordersByHealth[status].length;
            const isSelected = selectedTab === status;
            
            return (
              <button
                key={status}
                onClick={() => setSelectedTab(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected 
                    ? `${config.bgClass} ${config.borderClass} border ${config.textClass}` 
                    : 'bg-muted/50 border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {config.label.split(' ').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')} ({count})
              </button>
            );
          })}
        </div>

        {/* Order table for selected tab */}
        <OrderTable orderList={ordersByHealth[selectedTab]} />
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Total: {orders.length} orders
        </div>
      </DialogContent>
    </Dialog>
  );
}
