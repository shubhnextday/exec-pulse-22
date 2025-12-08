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
import type { CashFlowProjection } from '@/types/dashboard';

interface CashFlowDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projections: CashFlowProjection[];
}

export function CashFlowDetailsDialog({ open, onOpenChange, projections }: CashFlowDetailsDialogProps) {
  const totalExpected = projections.reduce((sum, p) => sum + p.expectedAmount, 0);
  const totalOrders = projections.reduce((sum, p) => sum + p.orderCount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Expected Cash Flow - ${totalExpected.toLocaleString()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Expected</div>
            <div className="text-xl font-bold text-primary">${totalExpected.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Orders</div>
            <div className="text-xl font-bold">{totalOrders}</div>
          </div>
        </div>
        
        <ScrollArea className="h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expected Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projections.map((projection, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {new Date(projection.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>{projection.customer}</TableCell>
                  <TableCell className="text-center">{projection.orderCount}</TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    ${projection.expectedAmount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {projections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No cash flow projections available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Based on estimated ship dates from {projections.length} date ranges
        </div>
      </DialogContent>
    </Dialog>
  );
}