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
import { OutstandingOrder } from '@/types/dashboard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OutstandingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: OutstandingOrder[];
}

export function OutstandingDetailsDialog({ 
  open, 
  onOpenChange, 
  orders 
}: OutstandingDetailsDialogProps) {
  // For "12 - Finished Goods Testing", use finalPaymentDue; otherwise use remainingDue
  const getOutstandingAmount = (order: OutstandingOrder) => {
    if (order.currentStatus === '12 - Finished Goods Testing') {
      return order.finalPaymentDue || 0;
    }
    return order.remainingDue || 0;
  };

  const totalOutstanding = orders.reduce((sum, o) => sum + getOutstandingAmount(o), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Outstanding Payments Details</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Total: ${totalOutstanding.toLocaleString()}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="h-[65vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-background [&_th]:bg-background">
              <TableRow className="border-b border-border">
                <TableHead>Sales Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>EST Ship Date</TableHead>
                <TableHead className="text-right">Order Total</TableHead>
                <TableHead className="text-right">Deposit Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No outstanding payments found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {order.salesOrderNumber || order.id}
                    </TableCell>
                    <TableCell className="font-medium">{order.customer}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {order.productName}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className="text-xs text-foreground bg-muted rounded-sm"
                      >
                        {order.currentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.estShipDate ? new Date(order.estShipDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(order.orderTotal || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${(order.depositAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ${getOutstandingAmount(order).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t pt-4 mt-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{orders.length} orders with outstanding payments</span>
            <span>
              Showing all-time outstanding (all orders)
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
