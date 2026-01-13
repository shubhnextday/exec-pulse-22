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

// Helper to check if a date is in current month
const isInCurrentMonth = (dateStr: string | undefined | null): boolean => {
  if (!dateStr) return false;
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const date = new Date(dateStr);
  return date >= currentMonthStart && date <= currentMonthEnd;
};

// Helper function to get the effective remaining due based on status
// Status 1-11: use remainingDue field
// Status 12: use finalPayment field (Final Payment Due)
const getEffectiveRemainingDue = (order: Order): number => {
  const statusNum = parseInt(order.currentStatus?.replace(/\D/g, '') || '0', 10);
  if (statusNum === 12) {
    return order.finalPayment || 0;
  }
  return order.remainingDue || 0;
};

export function RevenueDetailsDialog({ open, onOpenChange, orders }: RevenueDetailsDialogProps) {
  // Calculate totals based on what was received this month
  const totals = orders.reduce((acc, order) => {
    // Add deposit if received this month
    if (isInCurrentMonth(order.depositReceivedDate)) {
      acc.depositsReceived += order.depositAmount || 0;
    }
    // Add final payment if received this month
    if (isInCurrentMonth(order.finalPaymentReceivedDate)) {
      acc.finalPaymentsReceived += order.finalPayment || 0;
    }
    return acc;
  }, { depositsReceived: 0, finalPaymentsReceived: 0 });

  const totalCollected = totals.depositsReceived + totals.finalPaymentsReceived;

  // Calculate remaining due for display
  const totalRemainingDue = orders.reduce((sum, order) => sum + getEffectiveRemainingDue(order), 0);

  // Sort orders by amount collected (deposit + final payment received this month) descending
  const sortedOrders = [...orders].sort((a, b) => {
    const aAmount = (isInCurrentMonth(a.depositReceivedDate) ? (a.depositAmount || 0) : 0) +
                    (isInCurrentMonth(a.finalPaymentReceivedDate) ? (a.finalPayment || 0) : 0);
    const bAmount = (isInCurrentMonth(b.depositReceivedDate) ? (b.depositAmount || 0) : 0) +
                    (isInCurrentMonth(b.finalPaymentReceivedDate) ? (b.finalPayment || 0) : 0);
    return bAmount - aAmount;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="sr-only">Revenue Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total $ Collected This Month</div>
            <div className="text-xl font-bold text-primary">${totalCollected.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Deposits Received</div>
            <div className="text-xl font-bold text-emerald-600">${totals.depositsReceived.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Final Payments Received</div>
            <div className="text-xl font-bold text-blue-600">${totals.finalPaymentsReceived.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Remaining Due</div>
            <div className="text-xl font-bold text-amber-600">${totalRemainingDue.toLocaleString()}</div>
          </div>
        </div>
        
        <ScrollArea className="h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Sales Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Quoted Order Total</TableHead>
                <TableHead className="text-right">Gross Order Total</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Final Payment Received</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.salesOrderNumber || '-'}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${order.orderTotal?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${order.orderTotal?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    ${order.depositAmount?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="text-right text-blue-600">
                    {isInCurrentMonth(order.finalPaymentReceivedDate) 
                      ? `$${(order.finalPayment || 0).toLocaleString()}` 
                      : '$0'}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    ${getEffectiveRemainingDue(order).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No payments received this month
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
