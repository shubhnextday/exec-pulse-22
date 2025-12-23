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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Order } from '@/types/dashboard';

interface OrderHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

// Color configuration for each health status
const HEALTH_CONFIG = {
  'on-track': { label: 'On Track', color: 'emerald', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/30', textClass: 'text-emerald-600' },
  'at-risk': { label: 'At Risk', color: 'amber', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30', textClass: 'text-amber-600' },
  'off-track': { label: 'Off Track', color: 'red', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/30', textClass: 'text-red-600' },
  'complete': { label: 'Complete', color: 'blue', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30', textClass: 'text-blue-600' },
  'pending-deposit': { label: 'Pending Deposit', color: 'orange', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/30', textClass: 'text-orange-600' },
  'on-hold': { label: 'On Hold', color: 'gray', bgClass: 'bg-gray-500/10', borderClass: 'border-gray-500/30', textClass: 'text-gray-600' },
  'white-label': { label: 'White Label', color: 'violet', bgClass: 'bg-violet-500/10', borderClass: 'border-violet-500/30', textClass: 'text-violet-600' },
};

export function OrderHealthDialog({ open, onOpenChange, orders }: OrderHealthDialogProps) {
  // Group orders by health status
  const ordersByHealth = {
    'on-track': orders.filter(o => o.orderHealth === 'on-track'),
    'at-risk': orders.filter(o => o.orderHealth === 'at-risk'),
    'off-track': orders.filter(o => o.orderHealth === 'off-track'),
    'complete': orders.filter(o => o.orderHealth === 'complete'),
    'pending-deposit': orders.filter(o => o.orderHealth === 'pending-deposit'),
    'on-hold': orders.filter(o => o.orderHealth === 'on-hold'),
    'white-label': orders.filter(o => o.orderHealth === 'white-label'),
  };

  // Get statuses that have orders (for tabs)
  const activeStatuses = Object.entries(ordersByHealth)
    .filter(([_, orderList]) => orderList.length > 0)
    .map(([status]) => status);

  const OrderTable = ({ orderList }: { orderList: Order[] }) => (
    <ScrollArea className="h-[45vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Days Behind</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderList.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.customer}</TableCell>
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
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No orders in this category
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  // Default to showing the first status with orders, preferring off-track > at-risk > on-track
  const defaultTab = activeStatuses.includes('off-track') ? 'off-track' 
    : activeStatuses.includes('at-risk') ? 'at-risk' 
    : activeStatuses[0] || 'on-track';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Order Health Breakdown
          </DialogTitle>
        </DialogHeader>
        
        {/* Summary cards - show all statuses with counts */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
          {Object.entries(HEALTH_CONFIG).map(([key, config]) => {
            const count = ordersByHealth[key as keyof typeof ordersByHealth].length;
            return (
              <div 
                key={key} 
                className={`p-3 rounded-lg border text-center ${config.bgClass} ${config.borderClass}`}
              >
                <div className={`text-[10px] uppercase tracking-wider ${config.textClass}`}>{config.label}</div>
                <div className={`text-xl font-bold ${config.textClass}`}>{count}</div>
              </div>
            );
          })}
        </div>
        
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1">
            {Object.entries(HEALTH_CONFIG).map(([key, config]) => {
              const count = ordersByHealth[key as keyof typeof ordersByHealth].length;
              if (count === 0) return null;
              return (
                <TabsTrigger key={key} value={key} className="flex-1 min-w-[100px]">
                  {config.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
          {Object.entries(ordersByHealth).map(([key, orderList]) => (
            <TabsContent key={key} value={key}>
              <OrderTable orderList={orderList} />
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Total: {orders.length} orders
        </div>
      </DialogContent>
    </Dialog>
  );
}
