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

// Helper to extract status number from currentStatus string
const getStatusNumber = (order: Order): number | null => {
  const raw = (order.currentStatus || '').trim();
  if (!raw) return null;

  // Prefer an explicit numeric prefix like "12 - ..."
  const m = raw.match(/^\s*(\d+)\s*-/);
  if (m?.[1]) return Number(m[1]);

  // Fallback to label match
  const normalized = raw.toLowerCase();
  if (normalized.includes('finished goods testing')) return 12;
  if (normalized.includes('quote requirements')) return 0;

  return null;
};

// Check if order is in status 0-11 (uses remainingDue field)
const isStatus0to11 = (order: Order): boolean => {
  const statusNum = getStatusNumber(order);
  return statusNum != null && statusNum >= 0 && statusNum <= 11;
};

// Check if order is in status 12 (uses finalPaymentDue field)
const isStatus12 = (order: Order): boolean => {
  const statusNum = getStatusNumber(order);
  return statusNum === 12;
};

// Helper function to get the effective remaining due based on status
// Status 0-11: use remainingDue field
// Status 12: use finalPaymentDue field (Final Payment Due from Jira)
const getEffectiveRemainingDue = (order: Order): number => {
  if (isStatus12(order)) {
    const anyOrder = order as any;
    return (anyOrder.finalPaymentDue ?? order.finalPayment ?? 0) as number;
  }
  return order.remainingDue || 0;
};

export function RevenueDetailsDialog({ open, onOpenChange, orders }: RevenueDetailsDialogProps) {
  // Filter to only orders that actually have payments received this month
  const ordersWithPaymentsThisMonth = orders.filter(order => 
    isInCurrentMonth(order.depositReceivedDate) || isInCurrentMonth(order.finalPaymentReceivedDate)
  );

  // Calculate totals based on what was received this month
  const totals = ordersWithPaymentsThisMonth.reduce((acc, order) => {
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

  // Calculate remaining due ONLY for orders that have payments this month
  const totalRemainingDue = ordersWithPaymentsThisMonth.reduce((sum, order) => sum + getEffectiveRemainingDue(order), 0);

  // Sort orders by amount collected (deposit + final payment received this month) descending
  const sortedOrders = [...ordersWithPaymentsThisMonth].sort((a, b) => {
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
            <div className="text-sm text-muted-foreground">Remaining Due (These Orders)</div>
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
                <TableHead className="text-right">Quoted Total</TableHead>
                <TableHead className="text-right">Gross Total</TableHead>
                <TableHead className="text-right">Deposit Received</TableHead>
                <TableHead className="text-right">Final Received</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => {
                const depositThisMonth = isInCurrentMonth(order.depositReceivedDate) ? (order.depositAmount || 0) : 0;
                const finalThisMonth = isInCurrentMonth(order.finalPaymentReceivedDate) ? (order.finalPayment || 0) : 0;
                const anyOrder = order as any;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.salesOrderNumber || '-'}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="text-right">
                      ${(order.quotedOrderTotal ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(order.grossOrderTotal ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      ${depositThisMonth.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      ${finalThisMonth.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      ${getEffectiveRemainingDue(order).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedOrders.length === 0 && (
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
          {sortedOrders.length} orders with payments received this month
        </div>
      </DialogContent>
    </Dialog>
  );
}
