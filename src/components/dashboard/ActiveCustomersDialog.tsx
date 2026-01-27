import { useMemo, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import type { ActiveCustomer } from '@/types/dashboard';

interface ActiveCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: ActiveCustomer[];
}

export function ActiveCustomersDialog({ open, onOpenChange, customers }: ActiveCustomersDialogProps) {
  const [activeTab, setActiveTab] = useState('active');

  // Separate customers into Active and Non-Active based on order activity
  const { activeCustomers, nonActiveCustomers } = useMemo(() => {
    const active: ActiveCustomer[] = [];
    const nonActive: ActiveCustomer[] = [];

    customers.forEach(customer => {
      // Active Customer: has active order OR has placed an order in last 90 days
      const isActiveCustomer = customer.hasActiveOrder || customer.hasRecentOrder;
      
      if (isActiveCustomer) {
        active.push(customer);
      } else {
        nonActive.push(customer);
      }
    });

    return { activeCustomers: active, nonActiveCustomers: nonActive };
  }, [customers]);

  // Use the appropriate dataset based on active tab
  const currentDataset = activeTab === 'active' ? activeCustomers : nonActiveCustomers;

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
    data: currentDataset,
    searchableKeys: ['id', 'name', 'status'],
    initialSort: { key: 'name', direction: 'asc' },
  });

  const statusOptions = [...new Set(currentDataset.map(c => c.status))].map(s => ({
    label: s,
    value: s,
  }));

  const renderTable = () => (
    <div className="h-[50vh] overflow-auto">
      <Table>
        <TableHeader className="bg-background [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background">
          <TableRow className="border-b border-border">
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
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Active Customers ({activeCustomers.length})
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Source: JIRA CUS Project (status = Active)
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="text-xs">
              Active Customers ({activeCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="non_active" className="text-xs">
              Non-Active Customers ({nonActiveCustomers.length})
            </TabsTrigger>
          </TabsList>

          <TableControlsBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search customers..."
            filters={filters}
            onRemoveFilter={removeFilter}
            onClearFilters={clearFilters}
            className="px-0 border-b-0 mt-4"
          >
            <TableFilter
              label="Status"
              options={statusOptions}
              value={filters.find(f => f.key === 'status')?.value || ''}
              onChange={(value) => value ? addFilter('status', value) : removeFilter('status')}
            />
          </TableControlsBar>

          <TabsContent value="active" className="mt-0">
            {renderTable()}
          </TabsContent>
          <TabsContent value="non_active" className="mt-0">
            {renderTable()}
          </TabsContent>
        </Tabs>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          {activeTab === 'active' ? (
            <>Active Customers: <span className="font-semibold text-foreground">{filteredData.length}</span> (have active orders or ordered in last 90 days)</>
          ) : (
            <>Non-Active Customers: <span className="font-semibold text-foreground">{filteredData.length}</span></>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
