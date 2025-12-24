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
import type { ActiveCustomer } from '@/types/dashboard';

interface ActiveCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: ActiveCustomer[];
}

export function ActiveCustomersDialog({ open, onOpenChange, customers }: ActiveCustomersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Active Customers ({customers.length})
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Source: JIRA CUS Project (status = Active)
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">Active Orders</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell className="text-right">{customer.totalOrders ?? 0}</TableCell>
                  <TableCell className="text-right">{customer.activeOrders ?? 0}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {customer.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No active customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Total Active Customers: <span className="font-semibold text-foreground">{customers.length}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}