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
import type { Order } from '@/types/dashboard';

interface CommissionsDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function CommissionsDetailsDialog({ open, onOpenChange, orders }: CommissionsDetailsDialogProps) {
  const ordersWithCommission = orders.filter(o => (o.commissionDue || 0) > 0);
  
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
    data: ordersWithCommission,
    searchableKeys: ['customer', 'agent', 'id'],
  });

  const totalCommissions = filteredData.reduce((sum, o) => sum + (o.commissionDue || 0), 0);
  
  // Group by agent
  const agentData = filteredData.reduce((acc, order) => {
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

  const agentOptions = [...new Set(ordersWithCommission.map(o => o.agent || 'Unassigned'))].map(a => ({
    label: a,
    value: a,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
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
        <TableControlsBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search orders..."
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
          className="px-0 border-b-0 pb-3"
        >
          <TableFilter
            label="Agent"
            options={agentOptions}
            value={filters.find(f => f.key === 'agent')?.value || ''}
            onChange={(value) => value ? addFilter('agent', value) : removeFilter('agent')}
          />
        </TableControlsBar>

        <ScrollArea className="h-[35vh]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>
                  <SortableHeader
                    sortKey="id"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('id')}
                  >
                    Order ID
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
                    sortKey="agent"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('agent')}
                  >
                    Agent
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
                <TableHead className="text-right">
                  <SortableHeader
                    sortKey="commissionDue"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('commissionDue')}
                    className="justify-end"
                  >
                    Commission
                  </SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((order) => (
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
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No commissions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          {filteredData.length} orders have commissions due
        </div>
      </DialogContent>
    </Dialog>
  );
}
