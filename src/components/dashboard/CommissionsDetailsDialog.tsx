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

interface CommissionsDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function CommissionsDetailsDialog({ open, onOpenChange, orders }: CommissionsDetailsDialogProps) {
  const totalCommissions = orders.reduce((sum, o) => sum + (o.commissionDue || 0), 0);
  
  // Group by agent
  const agentData = orders.reduce((acc, order) => {
    const agent = order.agent || 'Unassigned';
    if (!acc[agent]) {
      acc[agent] = { orderCount: 0, totalValue: 0, commissionDue: 0 };
    }
    acc[agent].orderCount += 1;
    acc[agent].totalValue += order.orderTotal || 0;
    acc[agent].commissionDue += order.commissionDue || 0;
    return acc;
  }, {} as Record<string, { orderCount: number; totalValue: number; commissionDue: number }>);

  const agentList = Object.entries(agentData)
    .sort((a, b) => b[1].commissionDue - a[1].commissionDue);

  // Orders with commissions
  const ordersWithCommission = orders.filter(o => (o.commissionDue || 0) > 0)
    .sort((a, b) => (b.commissionDue || 0) - (a.commissionDue || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Commissions Due - ${totalCommissions.toLocaleString()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">By Agent</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {agentList.map(([agent, data]) => (
              <div key={agent} className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium truncate">{agent}</div>
                <div className="text-lg font-bold text-primary">
                  ${data.commissionDue.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.orderCount} orders
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <h3 className="font-semibold mb-2">Order Details</h3>
        <ScrollArea className="h-[40vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Order Total</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersWithCommission.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.agent || 'Unassigned'}</TableCell>
                  <TableCell className="text-right">
                    ${order.orderTotal?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    ${order.commissionDue?.toLocaleString() || '0'}
                  </TableCell>
                </TableRow>
              ))}
              {ordersWithCommission.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No commissions due
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          {ordersWithCommission.length} orders have commissions due
        </div>
      </DialogContent>
    </Dialog>
  );
}