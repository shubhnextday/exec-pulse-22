import { Commission } from '@/types/dashboard';
import { DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommissionsTableProps {
  commissions: Commission[];
}

export function CommissionsTable({ commissions }: CommissionsTableProps) {
  const totalDue = commissions.reduce((sum, c) => sum + c.commissionDue, 0);

  // Group by agent and aggregate
  const byAgent = commissions.reduce((acc, comm) => {
    if (!acc[comm.agent]) {
      acc[comm.agent] = { agent: comm.agent, total: 0, count: 0 };
    }
    acc[comm.agent].total += comm.commissionDue;
    acc[comm.agent].count += 1;
    return acc;
  }, {} as Record<string, { agent: string; total: number; count: number }>);

  const agentList = Object.values(byAgent).sort((a, b) => b.total - a.total);

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '800ms' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="icon-container icon-container-secondary">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Agent Commissions</h3>
          <p className="text-xs text-muted-foreground">From JIRA Commission Due field</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Due This Period</p>
          <p className="text-xl font-bold mono text-primary">${totalDue.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Orders</p>
          <p className="text-xl font-bold mono text-foreground">{commissions.length}</p>
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">By Agent</p>
      <ScrollArea className="h-[200px] pr-2">
        <div className="space-y-2">
          {agentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No commissions due</p>
              <p className="text-xs text-muted-foreground/70">in current filter</p>
            </div>
          ) : (
            agentList.map(({ agent, total, count }) => (
              <div key={agent} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">{agent}</p>
                  <p className="text-[11px] text-muted-foreground">{count} orders with commission</p>
                </div>
                <p className="text-base font-semibold mono text-primary">${total.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground text-center">
        Data source: JIRA customfield_11577
      </div>
    </div>
  );
}