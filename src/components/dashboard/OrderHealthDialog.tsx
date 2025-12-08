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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Order } from '@/types/dashboard';

interface OrderHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function OrderHealthDialog({ open, onOpenChange, orders }: OrderHealthDialogProps) {
  const onTrack = orders.filter(o => o.orderHealth === 'on-track');
  const atRisk = orders.filter(o => o.orderHealth === 'at-risk');
  const offTrack = orders.filter(o => o.orderHealth === 'off-track');

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'on-track':
        return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'at-risk':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'off-track':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Order Health Breakdown
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-center">
            <div className="text-sm text-emerald-600">On Track</div>
            <div className="text-2xl font-bold text-emerald-600">{onTrack.length}</div>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 text-center">
            <div className="text-sm text-amber-600">At Risk</div>
            <div className="text-2xl font-bold text-amber-600">{atRisk.length}</div>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30 text-center">
            <div className="text-sm text-red-600">Off Track</div>
            <div className="text-2xl font-bold text-red-600">{offTrack.length}</div>
          </div>
        </div>
        
        <Tabs defaultValue="off-track">
          <TabsList className="w-full">
            <TabsTrigger value="off-track" className="flex-1">
              Off Track ({offTrack.length})
            </TabsTrigger>
            <TabsTrigger value="at-risk" className="flex-1">
              At Risk ({atRisk.length})
            </TabsTrigger>
            <TabsTrigger value="on-track" className="flex-1">
              On Track ({onTrack.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="off-track">
            <OrderTable orderList={offTrack} />
          </TabsContent>
          <TabsContent value="at-risk">
            <OrderTable orderList={atRisk} />
          </TabsContent>
          <TabsContent value="on-track">
            <OrderTable orderList={onTrack} />
          </TabsContent>
        </Tabs>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Total: {orders.length} orders
        </div>
      </DialogContent>
    </Dialog>
  );
}