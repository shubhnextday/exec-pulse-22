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
import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import type { AgentPayment } from '@/types/dashboard';

interface CommissionsDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentPayments: AgentPayment[];
}

export function CommissionsDetailsDialog({ open, onOpenChange, agentPayments }: CommissionsDetailsDialogProps) {
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
    data: agentPayments,
    searchableKeys: ['agent', 'summary', 'id'],
  });

  const totalCommissions = filteredData.reduce((sum, p) => sum + (p.commissionDue || 0), 0);
  
  // Group by agent
  const agentData = filteredData.reduce((acc, payment) => {
    const agent = payment.agent || 'Unknown';
    if (!acc[agent]) {
      acc[agent] = { count: 0, total: 0 };
    }
    acc[agent].count += 1;
    acc[agent].total += payment.commissionDue || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const agentList = Object.entries(agentData)
    .sort((a, b) => b[1].total - a[1].total);

  const agentOptions = [...new Set(agentPayments.map(p => p.agent || 'Unknown'))].map(a => ({
    label: a,
    value: a,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Agent Commissions Due - ${totalCommissions.toLocaleString()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">By Agent</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {agentList.map(([agent, data]) => (
              <div key={agent} className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium truncate">{agent}</div>
                <div className="text-lg font-bold text-primary">
                  ${data.total.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.count} payments
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <h3 className="font-semibold mb-2">Payment Details</h3>
        <TableControlsBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search payments..."
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

        <div className="h-[35vh] overflow-auto">
          <Table>
            <TableHeader className="bg-background [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background">
              <TableRow className="border-b border-border">
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
                <TableHead>
                  <SortableHeader
                    sortKey="summary"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('summary')}
                  >
                    Summary
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
                    Commission Due
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    sortKey="created"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('created')}
                  >
                    Created
                  </SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.agent}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{payment.summary}</TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    ${payment.commissionDue?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell>{payment.created}</TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No pending payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="text-sm text-muted-foreground pt-2 border-t">
          {filteredData.length} pending payment tickets
        </div>
      </DialogContent>
    </Dialog>
  );
}
