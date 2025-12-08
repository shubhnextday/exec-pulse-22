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
import type { Order } from '@/types/dashboard';

interface RevenueDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function RevenueDetailsDialog({ open, onOpenChange, orders }: RevenueDetailsDialogProps) {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.orderTotal || 0), 0);
  const totalDeposits = orders.reduce((sum, o) => sum + (o.depositAmount || 0), 0);
  const totalRemaining = orders.reduce((sum, o) => sum + (o.remainingDue || 0), 0);

  // Sort orders by order total descending
  const sortedOrders = [...orders].sort((a, b) => (b.orderTotal || 0) - (a.orderTotal || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Revenue Details - ${totalRevenue.toLocaleString()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-xl font-bold text-primary">${totalRevenue.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Deposits Received</div>
            <div className="text-xl font-bold text-emerald-600">${totalDeposits.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Remaining Due</div>
            <div className="text-xl font-bold text-amber-600">${totalRemaining.toLocaleString()}</div>
          </div>
        </div>
        
        <ScrollArea className="h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Order Total</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${order.orderTotal?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    ${order.depositAmount?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    ${order.remainingDue?.toLocaleString() || '0'}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          {orders.length} orders included in revenue calculation
        </div>
      </DialogContent>
    </Dialog>
  );
}