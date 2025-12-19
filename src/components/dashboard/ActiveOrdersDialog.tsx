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
import type { Order } from '@/types/dashboard';

interface ActiveOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function ActiveOrdersDialog({ open, onOpenChange, orders }: ActiveOrdersDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            On-Track Orders ({orders.length})
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{order.productName}</TableCell>
                  <TableCell>{order.currentStatus}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getHealthColor(order.orderHealth)}>
                      {order.orderHealth}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${order.orderTotal?.toLocaleString() || '0'}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No active orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Total Value: <span className="font-semibold text-foreground">
            ${orders.reduce((sum, o) => sum + (o.orderTotal || 0), 0).toLocaleString()}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}