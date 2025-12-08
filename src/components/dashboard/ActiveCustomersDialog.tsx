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

interface ActiveCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function ActiveCustomersDialog({ open, onOpenChange, orders }: ActiveCustomersDialogProps) {
  // Aggregate orders by customer
  const customerData = orders.reduce((acc, order) => {
    const customer = order.customer || 'Unknown';
    if (!acc[customer]) {
      acc[customer] = { orderCount: 0, totalValue: 0, outstandingBalance: 0 };
    }
    acc[customer].orderCount += 1;
    acc[customer].totalValue += order.orderTotal || 0;
    acc[customer].outstandingBalance += order.remainingDue || 0;
    return acc;
  }, {} as Record<string, { orderCount: number; totalValue: number; outstandingBalance: number }>);

  const customerList = Object.entries(customerData)
    .filter(([name]) => name !== 'Unknown')
    .sort((a, b) => b[1].totalValue - a[1].totalValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Active Customers ({customerList.length})
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerList.map(([customer, data]) => (
                <TableRow key={customer}>
                  <TableCell className="font-medium">{customer}</TableCell>
                  <TableCell className="text-center">{data.orderCount}</TableCell>
                  <TableCell className="text-right">
                    ${data.totalValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${data.outstandingBalance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {customerList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No active customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t flex justify-between">
          <span>
            Total Orders: <span className="font-semibold text-foreground">{orders.length}</span>
          </span>
          <span>
            Total Value: <span className="font-semibold text-foreground">
              ${orders.reduce((sum, o) => sum + (o.orderTotal || 0), 0).toLocaleString()}
            </span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}