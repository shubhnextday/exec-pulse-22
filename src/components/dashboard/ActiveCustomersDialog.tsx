import { useState, useMemo } from 'react';
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
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ActiveCustomer } from '@/types/dashboard';

interface ActiveCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: ActiveCustomer[];
}

type SortField = 'id' | 'name' | 'totalOrders' | 'activeOrders' | 'status';
type SortDirection = 'asc' | 'desc';

export function ActiveCustomersDialog({ open, onOpenChange, customers }: ActiveCustomersDialogProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'totalOrders':
          aVal = a.totalOrders ?? 0;
          bVal = b.totalOrders ?? 0;
          break;
        case 'activeOrders':
          aVal = a.activeOrders ?? 0;
          bVal = b.activeOrders ?? 0;
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

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
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('id')}
                >
                  <span className="flex items-center">
                    Customer ID
                    <SortIcon field="id" />
                  </span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center">
                    Customer Name
                    <SortIcon field="name" />
                  </span>
                </TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('totalOrders')}
                >
                  <span className="flex items-center justify-end">
                    Total Orders
                    <SortIcon field="totalOrders" />
                  </span>
                </TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('activeOrders')}
                >
                  <span className="flex items-center justify-end">
                    Active Orders
                    <SortIcon field="activeOrders" />
                  </span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('status')}
                >
                  <span className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.map((customer) => (
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
              {sortedCustomers.length === 0 && (
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