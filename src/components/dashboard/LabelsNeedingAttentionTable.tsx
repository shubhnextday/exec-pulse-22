import { LabelOrder } from '@/types/dashboard';
import { AlertTriangle, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TableControlsBar, SortableHeader } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LabelsNeedingAttentionTableProps {
  labelOrders: LabelOrder[];
}

function HealthBadge({ health }: { health: 'on-track' | 'at-risk' | 'off-track' }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
      health === 'on-track' && "status-on-track",
      health === 'at-risk' && "status-at-risk",
      health === 'off-track' && "status-off-track",
    )}>
      {(health === 'at-risk' || health === 'off-track') && <AlertTriangle className="h-3 w-3" />}
      {health.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

export function LabelsNeedingAttentionTable({ labelOrders }: LabelsNeedingAttentionTableProps) {
  const {
    filteredData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,
    filters,
    removeFilter,
    clearFilters,
  } = useTableFeatures({
    data: labelOrders,
    searchableKeys: ['customer', 'productName', 'salesOrderNumber', 'currentStatus'],
  });

  // Sort by severity and days behind
  const sortedOrders = [...filteredData].sort((a, b) => {
    if (sortConfig.key) return 0;
    if (a.labelHealth === 'off-track' && b.labelHealth !== 'off-track') return -1;
    if (a.labelHealth !== 'off-track' && b.labelHealth === 'off-track') return 1;
    return b.daysBehindSchedule - a.daysBehindSchedule;
  });

  return (
    <div className="metric-card opacity-0 animate-slide-up !p-0 overflow-hidden" style={{ animationDelay: '600ms' }}>
      <div className="p-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="icon-container bg-warning/10 text-warning">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Labels Needing Attention</h3>
            <p className="text-xs text-muted-foreground">
              {sortedOrders.length} labels requiring review
            </p>
          </div>
        </div>
      </div>

      <TableControlsBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search labels..."
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearFilters}
      />
      
      {sortedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <Tag className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground">All Labels On Track</p>
          <p className="text-xs text-muted-foreground">No labels need attention</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="min-w-max">
            <table className="data-table w-full">
              <thead className="sticky top-0 z-20 bg-card">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[120px]">
                    <SortableHeader
                      sortKey="labelHealth"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('labelHealth' as keyof LabelOrder)}
                    >
                      Health
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[150px]">
                    <SortableHeader
                      sortKey="customer"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('customer' as keyof LabelOrder)}
                    >
                      Customer
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 max-w-[180px]">
                    <SortableHeader
                      sortKey="productName"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('productName' as keyof LabelOrder)}
                    >
                      Product Name
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[120px]">
                    <SortableHeader
                      sortKey="salesOrderNumber"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('salesOrderNumber' as keyof LabelOrder)}
                    >
                      Sales Order #
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[150px]">
                    <SortableHeader
                      sortKey="currentStatus"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('currentStatus' as keyof LabelOrder)}
                    >
                      Status
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[140px]">
                    <SortableHeader
                      sortKey="designDueDate"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('designDueDate' as keyof LabelOrder)}
                    >
                      Design Due Date
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[180px]">
                    <SortableHeader
                      sortKey="daysBehindSchedule"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('daysBehindSchedule' as keyof LabelOrder)}
                    >
                      <span className="flex flex-col leading-tight">
                        <span>Days Behind Schedule</span>
                        <span className="text-[10px] normal-case font-normal opacity-70">(Days behind Design Due Date)</span>
                      </span>
                    </SortableHeader>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((label) => (
                  <TooltipProvider key={label.id} delayDuration={500}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <tr className="hover:bg-primary/5 transition-colors cursor-pointer">
                          <td className="px-4 py-3.5 border-t border-border/30">
                            <HealthBadge health={label.labelHealth} />
                          </td>
                          <td className="px-4 py-3.5 border-t border-border/30">
                            <span className="font-medium text-foreground">{label.customer}</span>
                          </td>
                          <td className="px-4 py-3.5 border-t border-border/30 max-w-[180px]">
                            <span className="text-muted-foreground truncate block">{label.productName}</span>
                          </td>
                          <td className="px-4 py-3.5 border-t border-border/30">
                            <span className="mono text-sm">{label.salesOrderNumber}</span>
                          </td>
                          <td className="px-4 py-3.5 border-t border-border/30">
                            <span className="text-sm">{label.currentStatus}</span>
                          </td>
                          <td className="px-4 py-3.5 border-t border-border/30">
                            <span className="mono text-sm">{label.designDueDate || '—'}</span>
                          </td>
                          <td className="px-4 py-3.5 border-t border-border/30">
                            <span className={cn(
                              "mono text-sm font-medium",
                              label.daysBehindSchedule > 0 && "text-danger"
                            )}>
                              {label.daysBehindSchedule > 0 ? `-${label.daysBehindSchedule}` : '0'} days
                            </span>
                          </td>
                        </tr>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="p-0">
                        <div className="p-3 max-w-md space-y-2 text-sm bg-card rounded-lg">
                          <div className="font-semibold text-base border-b border-border pb-2 text-foreground">{label.customer}</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <span className="text-muted-foreground">Product:</span>
                            <span className="text-foreground">{label.productName}</span>
                            <span className="text-muted-foreground">Sales Order:</span>
                            <span className="mono text-foreground">{label.salesOrderNumber}</span>
                            <span className="text-muted-foreground">Current Status:</span>
                            <span className="text-foreground">{label.currentStatus}</span>
                            <span className="text-muted-foreground">Design Due Date:</span>
                            <span className="text-foreground">{label.designDueDate || '—'}</span>
                            <span className="text-muted-foreground">Days Behind:</span>
                            <span className={cn("text-foreground", label.daysBehindSchedule > 0 && "text-danger font-medium")}>
                              {label.daysBehindSchedule > 0 ? `-${label.daysBehindSchedule}` : '0'} days
                            </span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
