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
import { TableControlsBar, SortableHeader } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Order } from '@/types/dashboard';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, isWithinInterval } from 'date-fns';

interface ExpectedCashFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  customers: string[];
}

type MonthFilter = 'all' | 'this-month' | 'next-month' | 'month-after' | 'future';

// Helper function to get status number from order
const getStatusNumber = (order: Order): number => {
  return parseInt(order.currentStatus?.replace(/\D/g, '') || '0', 10);
};

// Check if order is in status 1-11 (Ready to Start through In Packaging)
const isStatus1to11 = (order: Order): boolean => {
  const statusNum = getStatusNumber(order);
  return statusNum >= 1 && statusNum <= 11;
};

// Check if order is in status 12 (Finished Goods Testing)
const isStatus12 = (order: Order): boolean => {
  const statusNum = getStatusNumber(order);
  return statusNum === 12;
};

// Get Remaining Due value (only for status 1-11)
const getRemainingDueValue = (order: Order): number => {
  return isStatus1to11(order) ? (order.remainingDue || 0) : 0;
};

// Get Final Payment value (only for status 12)
const getFinalPaymentValue = (order: Order): number => {
  return isStatus12(order) ? (order.finalPayment || 0) : 0;
};

export function ExpectedCashFlowDialog({ 
  open, 
  onOpenChange, 
  orders,
  customers 
}: ExpectedCashFlowDialogProps) {
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('this-month');
  const [selectedCustomer, setSelectedCustomer] = useState('All Customers');
  
  // Filter orders to only those with EST Ship Date and remaining due > 0
  const activeOrdersWithShipDate = useMemo(() => {
    return orders.filter(order => {
      const shipDate = order.estShipDate || order.dueDate;
      if (!shipDate) return false;
      // Include orders with remaining due > 0 OR orderTotal > 0 (to show expected revenue)
      return (order.remainingDue > 0 || order.orderTotal > 0);
    });
  }, [orders]);

  // Apply month filter
  const monthFilteredOrders = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const nextMonthStart = startOfMonth(addMonths(now, 1));
    const nextMonthEnd = endOfMonth(addMonths(now, 1));
    const monthAfterStart = startOfMonth(addMonths(now, 2));
    const monthAfterEnd = endOfMonth(addMonths(now, 2));

    return activeOrdersWithShipDate.filter(order => {
      const shipDate = order.estShipDate || order.dueDate;
      if (!shipDate) return false;
      
      const shipDateParsed = parseISO(shipDate);
      
      switch (monthFilter) {
        case 'all':
          return true;
        case 'this-month':
          return isWithinInterval(shipDateParsed, { start: thisMonthStart, end: thisMonthEnd });
        case 'next-month':
          return isWithinInterval(shipDateParsed, { start: nextMonthStart, end: nextMonthEnd });
        case 'month-after':
          return isWithinInterval(shipDateParsed, { start: monthAfterStart, end: monthAfterEnd });
        case 'future':
          return shipDateParsed > monthAfterEnd;
        default:
          return true;
      }
    });
  }, [activeOrdersWithShipDate, monthFilter]);

  // Apply customer filter
  const customerFilteredOrders = useMemo(() => {
    if (selectedCustomer === 'All Customers') return monthFilteredOrders;
    return monthFilteredOrders.filter(order => order.customer === selectedCustomer);
  }, [monthFilteredOrders, selectedCustomer]);

  const {
    filteredData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,
  } = useTableFeatures({
    data: customerFilteredOrders,
    searchableKeys: ['productName', 'customer', 'agent', 'id', 'salesOrderNumber'],
    initialSort: { key: 'estShipDate', direction: 'asc' },
  });

  // Calculate totals - only sum visible values based on status
  const totals = useMemo(() => {
    const totalQuotedOrderTotal = filteredData.reduce((sum, o) => sum + (o.orderTotal || 0), 0);
    const totalDeposits = filteredData.reduce((sum, o) => sum + (o.depositAmount || 0), 0);
    // Final Payments: sum only from status 12 orders
    const totalFinalPayment = filteredData.reduce((sum, o) => sum + getFinalPaymentValue(o), 0);
    // Remaining Due: sum only from status 1-11 orders
    const totalRemainingDue = filteredData.reduce((sum, o) => sum + getRemainingDueValue(o), 0);
    return { totalQuotedOrderTotal, totalDeposits, totalFinalPayment, totalRemainingDue };
  }, [filteredData]);

  // Get month labels
  const now = new Date();
  const thisMonthLabel = format(now, 'MMMM');
  const nextMonthLabel = format(addMonths(now, 1), 'MMMM');
  const monthAfterLabel = format(addMonths(now, 2), 'MMMM');

  // Customer options for filter are the customers array directly

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Expected Cash Flow
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            How much money is coming in by EST Ship Date? Based on Quoted Order Total.
          </p>
        </DialogHeader>

        {/* Month Filter Tabs */}
        <Tabs value={monthFilter} onValueChange={(v) => setMonthFilter(v as MonthFilter)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="this-month">{thisMonthLabel}</TabsTrigger>
            <TabsTrigger value="next-month">{nextMonthLabel}</TabsTrigger>
            <TabsTrigger value="month-after">{monthAfterLabel}</TabsTrigger>
            <TabsTrigger value="future">Future</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Quoted Order Total</div>
            <div className="text-lg font-bold text-foreground">${totals.totalQuotedOrderTotal.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Deposits Collected</div>
            <div className="text-lg font-bold text-green-600">${totals.totalDeposits.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Final Payments</div>
            <div className="text-lg font-bold text-foreground">${totals.totalFinalPayment.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Remaining Due</div>
            <div className="text-lg font-bold text-primary">${totals.totalRemainingDue.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <TableControlsBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by order, customer, product, or agent..."
              className="px-0 border-b-0 pb-0"
            />
          </div>
          <div className="w-[200px]">
            <SearchableSelect
              options={customers}
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              placeholder="Filter by customer"
              allLabel="All Customers"
            />
          </div>
        </div>
        
        <div className="h-[50vh] overflow-auto">
          <div className="min-w-[1200px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Sales Order #</TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="productName"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('productName')}
                  >
                    Summary
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
                    sortKey="startDate"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('startDate')}
                  >
                    Start Date
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="estShipDate"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('estShipDate')}
                  >
                    EST Ship Date
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
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Final Payment</TableHead>
                <TableHead className="text-right">
                  <SortableHeader
                    sortKey="remainingDue"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('remainingDue')}
                    className="justify-end"
                  >
                    Remaining Due
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
                <TableHead className="text-right">Comm %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((order) => {
                const shipDate = order.estShipDate || order.dueDate;
                const commissionPercent = order.commissionPercent != null 
                  ? order.commissionPercent.toFixed(1)
                  : '0.0';
                
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.salesOrderNumber || order.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={order.productName}>
                      {order.productName}
                    </TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="text-sm">
                      {order.startDate ? format(parseISO(order.startDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {shipDate ? format(parseISO(shipDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(order.orderTotal || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ${(order.depositAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {isStatus12(order) 
                        ? (order.finalPayment != null ? `$${order.finalPayment.toLocaleString()}` : 'N/A')
                        : ''}
                    </TableCell>
                    <TableCell className="text-right font-bold text-orange-500">
                      {isStatus1to11(order) 
                        ? (order.remainingDue != null ? `$${order.remainingDue.toLocaleString()}` : 'N/A')
                        : ''}
                    </TableCell>
                    <TableCell>{order.agent || '-'}</TableCell>
                    <TableCell className="text-right">{commissionPercent}%</TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    No orders found for the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground pt-2 border-t flex justify-between items-center">
          <span>
            Showing {filteredData.length} orders • Expected revenue based on EST Ship Date
          </span>
          <span className="font-medium text-primary">
            Total Remaining Due: ${totals.totalRemainingDue.toLocaleString()}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
