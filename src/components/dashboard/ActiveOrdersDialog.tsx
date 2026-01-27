import { useEffect } from 'react';
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
import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import type { Order } from '@/types/dashboard';

interface ActiveOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  initialSearchQuery?: string;
}

export function ActiveOrdersDialog({ open, onOpenChange, orders, initialSearchQuery = '' }: ActiveOrdersDialogProps) {
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
    data: orders,
    searchableKeys: ['customer', 'productName', 'salesOrderNumber', 'currentStatus'],
  });

  // Sync search query when dialog opens with initialSearchQuery
  useEffect(() => {
    if (open) {
      setSearchQuery(initialSearchQuery);
    }
  }, [open, initialSearchQuery, setSearchQuery]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'on-track':
        return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'at-risk':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'off-track':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const healthOptions = [
    { label: 'On Track', value: 'on-track' },
    { label: 'At Risk', value: 'at-risk' },
    { label: 'Off Track', value: 'off-track' },
  ];

  const statusOptions = [...new Set(orders.map(o => o.currentStatus))].map(s => ({
    label: s,
    value: s,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Active Orders ({filteredData.length})
          </DialogTitle>
        </DialogHeader>

        <TableControlsBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search orders..."
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
          className="px-0 border-b-0"
        >
          <TableFilter
            label="Health"
            options={healthOptions}
            value={filters.find(f => f.key === 'orderHealth')?.value || ''}
            onChange={(value) => value ? addFilter('orderHealth', value) : removeFilter('orderHealth')}
          />
          <TableFilter
            label="Status"
            options={statusOptions}
            value={filters.find(f => f.key === 'currentStatus')?.value || ''}
            onChange={(value) => value ? addFilter('currentStatus', value) : removeFilter('currentStatus')}
          />
        </TableControlsBar>
        
        <div className="h-[50vh] overflow-auto">
          <Table>
            <TableHeader className="bg-background [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background">
              <TableRow className="border-b border-border">
                <TableHead>
                  <SortableHeader
                    sortKey="salesOrderNumber"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('salesOrderNumber')}
                  >
                    Sales Order #
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="customer"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('customer')}
                  >
                    Customer
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="productName"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('productName')}
                  >
                    Product
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="currentStatus"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('currentStatus')}
                  >
                    Status
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="orderHealth"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('orderHealth')}
                  >
                    Health
                  </SortableHeader>
                </TableHead>
                <TableHead className="text-right">
                  <SortableHeader
                    sortKey="orderTotal"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('orderTotal')}
                    className="justify-end"
                  >
                    Order Total
                  </SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.salesOrderNumber || '-'}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{order.productName}</TableCell>
                  <TableCell>{order.currentStatus}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getHealthColor(order.orderHealth)}>
                      {order.orderHealth}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${order.orderTotal?.toLocaleString() || '0'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          Total Value: <span className="font-semibold text-foreground">
            ${filteredData.reduce((sum, o) => sum + (o.orderTotal || 0), 0).toLocaleString()}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
