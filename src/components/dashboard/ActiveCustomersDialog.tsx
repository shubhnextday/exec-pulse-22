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
import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import type { ActiveCustomer } from '@/types/dashboard';

interface ActiveCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: ActiveCustomer[];
}

export function ActiveCustomersDialog({ open, onOpenChange, customers }: ActiveCustomersDialogProps) {
  const {
    filteredData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
  } = useTableFeatures({
    data: customers,
    searchableKeys: ['id', 'name', 'status'],
    initialSort: { key: 'name', direction: 'asc' },
  });

  const statusOptions = [...new Set(customers.map(c => c.status))].map(s => ({
    label: s,
    value: s,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Active Customers ({filteredData.length})
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Source: JIRA CUS Project (status = Active)
          </p>
        </DialogHeader>

        <TableControlsBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search customers..."
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
          className="px-0 border-b-0"
        >
          <TableFilter
            label="Status"
            options={statusOptions}
            value={filters.find(f => f.key === 'status')?.value || ''}
            onChange={(value) => value ? addFilter('status', value) : removeFilter('status')}
          />
        </TableControlsBar>
        
        <ScrollArea className="h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader
                    sortKey="id"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('id')}
                  >
                    Customer ID
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="name"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('name')}
                  >
                    Customer Name
                  </SortableHeader>
                </TableHead>
                <TableHead className="text-right">
                  <SortableHeader
                    sortKey="totalOrders"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('totalOrders')}
                    className="justify-end"
                  >
                    Total Orders
                  </SortableHeader>
                </TableHead>
                <TableHead className="text-right">
                  <SortableHeader
                    sortKey="activeOrders"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('activeOrders')}
                    className="justify-end"
                  >
                    Active Orders
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="status"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('status')}
                  >
                    Status
                  </SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((customer) => (
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
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Total Active Customers: <span className="font-semibold text-foreground">{filteredData.length}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
