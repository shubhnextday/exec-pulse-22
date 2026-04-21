// rebuild
import { Order, OrderHealth } from '@/types/dashboard';
import { AlertTriangle, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NeedsAttentionTableProps {
  orders: Order[];
}

// Helper to strip number prefix like "10 - " from status strings
const stripStatusPrefix = (status: string): string => {
  return status.replace(/^\d+\s*-\s*/, '');
};

interface ColumnDef {
  id: string;
  label: string;
  width?: string;
  accessor: (order: Order) => React.ReactNode;
}

const ALL_COLUMNS: ColumnDef[] = [
  {
    id: 'health',
    label: 'Health',
    width: 'w-[140px]',
    accessor: (order) => <HealthBadge health={order.orderHealth} />,
  },
  {
    id: 'customer',
    label: 'Customer',
    width: 'min-w-[150px]',
    accessor: (order) => <span className="font-medium text-foreground">{order.customer}</span>,
  },
  {
    id: 'product',
    label: 'Product',
    width: 'max-w-[180px]',
    accessor: (order) => <span className="text-muted-foreground truncate block">{order.productName}</span>,
  },
  {
    id: 'salesOrder',
    label: 'Sales Order #',
    width: 'min-w-[120px]',
    accessor: (order) => <span className="mono text-sm">{order.salesOrderNumber}</span>,
  },
  {
    id: 'currentStatus',
    label: 'Current Status',
    width: 'min-w-[150px]',
    accessor: (order) => <span className="text-sm">{order.currentStatus}</span>,
  },
  {
    id: 'expectedStatus',
    label: 'Expected Status',
    width: 'min-w-[150px]',
    accessor: (order) => <span className="text-sm text-muted-foreground">{stripStatusPrefix(order.expectedStatus)}</span>,
  },
  {
    id: 'behindSchedule',
    label: 'Behind Schedule',
    width: 'min-w-[130px]',
    accessor: (order) => (
      <span className={cn("mono text-sm font-medium", order.daysBehindSchedule > 0 && "text-danger")}>
        {order.daysBehindSchedule > 0 ? `-${order.daysBehindSchedule}` : '0'} days
      </span>
    ),
  },
  {
    id: 'estShipDate',
    label: 'Est. Ship Date',
    width: 'min-w-[120px]',
    accessor: (order) => <span className="text-sm">{order.estShipDate}</span>,
  },
  {
    id: 'quantity',
    label: 'Quantity',
    width: 'min-w-[100px]',
    accessor: (order) => <span className="mono text-sm">{order.quantityOrdered.toLocaleString()}</span>,
  },
];

function HealthBadge({ health }: { health: OrderHealth }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
      health === 'on-track' && "status-on-track",
      health === 'at-risk' && "status-at-risk",
      health === 'off-track' && "status-off-track",
    )}>
      {health === 'at-risk' && <AlertTriangle className="h-3 w-3" />}
      {health === 'off-track' && <AlertTriangle className="h-3 w-3" />}
      {health.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

function SortableColumnHeader({ column, children }: { column: ColumnDef; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30",
        column.width,
        isDragging && "opacity-50 bg-primary/10"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        {children}
      </div>
    </th>
  );
}

function OrderRowTooltipContent({ order }: { order: Order }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-[140px_1fr] gap-y-2.5">
        <span className="text-muted-foreground">Product:</span>
        <span className="text-foreground">{order.productName}</span>
        <span className="text-muted-foreground">Sales Order:</span>
        <span className="mono text-foreground">{order.salesOrderNumber}</span>
        <span className="text-muted-foreground">Current Status:</span>
        <span className="text-foreground">{order.currentStatus}</span>
        <span className="text-muted-foreground">Expected Status:</span>
        <span className="text-foreground">{stripStatusPrefix(order.expectedStatus)}</span>
        <span className="text-muted-foreground">Behind Schedule:</span>
        <span className={cn("text-foreground", order.daysBehindSchedule > 0 && "text-danger font-medium")}>
          {order.daysBehindSchedule > 0 ? `-${order.daysBehindSchedule}` : '0'} days
        </span>
        <span className="text-muted-foreground">Est. Ship Date:</span>
        <span className="text-foreground">{order.estShipDate}</span>
        <span className="text-muted-foreground">Quantity:</span>
        <span className="mono text-foreground">{order.quantityOrdered.toLocaleString()}</span>
        <span className="text-muted-foreground">Order Total:</span>
        <span className="mono text-foreground">${order.orderTotal.toLocaleString()}</span>
      </div>
      {order.orderNotes && (
        <div className="border-t border-border pt-3">
          <span className="text-muted-foreground text-xs font-semibold uppercase">Notes:</span>
          <p className="mt-1 text-foreground">{order.orderNotes}</p>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, columns, onClick }: { 
  order: Order; 
  columns: ColumnDef[];
  onClick: () => void;
}) {
  return (
    <tr 
      className="cursor-pointer hover:bg-primary/5 transition-colors"
      onClick={onClick}
    >
      <td className="px-4 py-3.5 border-t border-border/30 sticky left-0 bg-card z-10" />
      {columns.map((col) => (
        <td key={col.id} className={cn("px-4 py-3.5 border-t border-border/30", col.width)}>
          {col.accessor(order)}
        </td>
      ))}
    </tr>
  );
}

export function NeedsAttentionTable({ orders }: NeedsAttentionTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(ALL_COLUMNS.map(c => c.id));

  const attentionOrders = orders.filter(
    o => o.orderHealth === 'at-risk' || o.orderHealth === 'off-track'
  );

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
    data: attentionOrders,
    searchableKeys: ['customer', 'productName', 'salesOrderNumber', 'currentStatus'],
  });

  // Sort by severity and days behind
  const sortedOrders = [...filteredData].sort((a, b) => {
    if (sortConfig.key) return 0; // Let useTableFeatures handle custom sort
    if (a.orderHealth === 'off-track' && b.orderHealth !== 'off-track') return -1;
    if (a.orderHealth !== 'off-track' && b.orderHealth === 'off-track') return 1;
    return b.daysBehindSchedule - a.daysBehindSchedule;
  });

  const orderedColumns = columnOrder
    .map(id => ALL_COLUMNS.find(c => c.id === id))
    .filter(Boolean) as ColumnDef[];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const healthOptions = [
    { label: 'Off Track', value: 'off-track' },
    { label: 'At Risk', value: 'at-risk' },
  ];

  return (
    <div className="metric-card opacity-0 animate-slide-up !p-0 overflow-hidden" style={{ animationDelay: '500ms' }}>
      <div className="p-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="icon-container bg-danger/10 text-danger">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Orders Needing Attention</h3>
            <p className="text-xs text-muted-foreground">
              {sortedOrders.length} orders requiring immediate review
            </p>
          </div>
        </div>
      </div>

      <TableControlsBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search orders..."
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearFilters}
      />
      
      {sortedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground">All Orders On Track</p>
          <p className="text-xs text-muted-foreground">No orders need attention</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="min-w-max">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="data-table w-full">
                <thead className="sticky top-0 z-20 bg-card">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 w-[50px] sticky left-0 z-20">
                      {/* Expand column */}
                    </th>
                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                      {orderedColumns.map((col) => (
                        <SortableColumnHeader key={col.id} column={col}>
                          <SortableHeader
                            sortKey={col.id}
                            currentSortKey={sortConfig.key as string}
                            direction={sortConfig.direction}
                            onSort={() => handleSort(col.id as keyof Order)}
                          >
                            {col.label}
                          </SortableHeader>
                        </SortableColumnHeader>
                      ))}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      columns={orderedColumns}
                      onClick={() => setSelectedOrder(order)}
                    />
                  ))}
                </tbody>
              </table>
            </DndContext>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader className="pr-6">
                <p className="text-[11px] mono text-muted-foreground tracking-wider uppercase">
                  {selectedOrder.salesOrderNumber}
                </p>
                <DialogTitle className="text-lg font-semibold text-foreground leading-tight">
                  {selectedOrder.customer}
                </DialogTitle>
                <p className="text-sm text-muted-foreground pt-0.5">{selectedOrder.productName}</p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <HealthBadge health={selectedOrder.orderHealth} />
                  {selectedOrder.daysBehindSchedule > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-danger/30 bg-danger/10 text-danger">
                      <AlertTriangle className="h-3 w-3" />
                      {selectedOrder.daysBehindSchedule} days behind
                    </span>
                  )}
                </div>
              </DialogHeader>

              {/* Status section */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current Status</p>
                    <p className="text-sm font-medium text-foreground">{selectedOrder.currentStatus}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Expected Status</p>
                    <p className="text-sm font-medium text-foreground">{stripStatusPrefix(selectedOrder.expectedStatus)}</p>
                  </div>
                </div>
              </div>

              {/* Metrics cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/50 bg-card p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Quantity</p>
                  <p className="mono text-lg font-semibold text-foreground">
                    {selectedOrder.quantityOrdered.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Order Total</p>
                  <p className="mono text-lg font-semibold text-foreground">
                    ${selectedOrder.orderTotal.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Behind</p>
                  <p className={cn(
                    "mono text-lg font-semibold",
                    selectedOrder.daysBehindSchedule > 0 ? "text-danger" : "text-foreground"
                  )}>
                    {selectedOrder.daysBehindSchedule > 0 ? `-${selectedOrder.daysBehindSchedule}` : '0'} days
                  </p>
                </div>
              </div>

              {/* Schedule */}
              <div className="rounded-lg border border-border/50">
                <div className="px-4 py-2.5 border-b border-border/50 bg-muted/20">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schedule</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Est. Ship Date</p>
                    <p className="text-foreground">{selectedOrder.estShipDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Sales Order #</p>
                    <p className="mono text-foreground">{selectedOrder.salesOrderNumber}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.orderNotes && (
                <div className="rounded-lg border border-border/50">
                  <div className="px-4 py-2.5 border-b border-border/50 bg-muted/20">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Notes</span>
                  </div>
                  <p className="p-4 text-sm text-foreground whitespace-pre-wrap">{selectedOrder.orderNotes}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
