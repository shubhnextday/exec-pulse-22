import { AgentPayment } from '@/types/dashboard';
import { DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CommissionsTableProps {
  agentPayments: AgentPayment[];
}

export function CommissionsTable({ agentPayments }: CommissionsTableProps) {
  const totalDue = agentPayments.reduce((sum, p) => sum + p.commissionDue, 0);

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '800ms' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="icon-container icon-container-secondary">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Agent Commissions</h3>
          <p className="text-xs text-muted-foreground">Pending Payment tickets from Agent Management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Commission Due</p>
          <p className="text-xl font-bold mono text-primary">${totalDue.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pending Payments</p>
          <p className="text-xl font-bold mono text-foreground">{agentPayments.length}</p>
        </div>
      </div>

      <ScrollArea className="h-[300px] pr-2">
        {agentPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No commissions due</p>
            <p className="text-xs text-muted-foreground/70">No pending payment tickets found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="text-xs">Agent</TableHead>
                <TableHead className="text-xs">Summary</TableHead>
                <TableHead className="text-xs text-right">Commission Due</TableHead>
                <TableHead className="text-xs">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{payment.agent}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{payment.summary}</TableCell>
                  <TableCell className="text-right font-semibold mono text-primary text-sm">
                    ${payment.commissionDue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{payment.created}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
      
      <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground text-center">
        Data source: Agent Management &gt; Payment &gt; Pending Payment
      </div>
    </div>
  );
}
