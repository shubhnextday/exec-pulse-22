import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CashFlowProjection } from '@/types/dashboard';

interface CashFlowDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projections: CashFlowProjection[];
}

export function CashFlowDetailsDialog({ open, onOpenChange, projections }: CashFlowDetailsDialogProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  
  const totalExpected = projections.reduce((sum, p) => sum + p.expectedAmount, 0);
  const totalOrders = projections.reduce((sum, p) => sum + p.orderCount, 0);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Expected Cash Flow Details
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
        
        <ScrollArea className="h-[55vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>EST Ship Date</TableHead>
                <TableHead>Sales Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Remaining Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projections.map((projection, index) => {
                const isExpanded = expandedDates.has(projection.date);
                const hasOrders = projection.orders && projection.orders.length > 0;
                
                return (
                  <>
                    {/* Date Summary Row */}
                    <TableRow 
                      key={`summary-${index}`} 
                      className="bg-muted/30 cursor-pointer hover:bg-muted/50"
                      onClick={() => hasOrders && toggleDate(projection.date)}
                    >
                      <TableCell className="w-8">
                        {hasOrders && (
                          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {new Date(projection.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell colSpan={2} className="text-muted-foreground">
                        {projection.orderCount} order{projection.orderCount !== 1 ? 's' : ''} • {projection.customer}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        ${projection.expectedAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    
                    {/* Individual Order Rows */}
                    {isExpanded && hasOrders && projection.orders!.map((order, orderIndex) => (
                      <TableRow key={`order-${index}-${orderIndex}`} className="bg-background">
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="font-mono text-sm">{order.id}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={order.productName}>
                          {order.productName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${order.remainingDue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}
              {projections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No cash flow projections available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Click a date row to expand and see individual orders. Based on EST Ship Date from {totalOrders} orders.
        </div>
      </DialogContent>
    </Dialog>
  );
}
