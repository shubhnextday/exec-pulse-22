import { Commission } from '@/types/dashboard';
import { DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommissionsTableProps {
  commissions: Commission[];
}

export function CommissionsTable({ commissions }: CommissionsTableProps) {
  const totalDue = commissions.reduce((sum, c) => sum + c.commissionDue, 0);
  const totalPaid = commissions.reduce((sum, c) => sum + c.commissionPaid, 0);

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
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10">
          <DollarSign className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Agent Commissions</h3>
          <p className="text-sm text-muted-foreground">From JIRA Commission Due field</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground">Due This Period</p>
          <p className="text-xl font-bold text-warning mono">${totalDue.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-xl font-bold mono">{commissions.length}</p>
        </div>
      </div>

      <h4 className="text-sm font-medium text-muted-foreground mb-2">By Agent</h4>
      <ScrollArea className="h-[200px] pr-2">
        <div className="space-y-2">
          {agentList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No commissions due in current filter
            </p>
          ) : (
            agentList.map(({ agent, total, count }) => (
              <div key={agent} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/20 last:border-0">
                <div>
                  <p className="font-medium text-sm">{agent}</p>
                  <p className="text-xs text-muted-foreground">{count} orders with commission</p>
                </div>
                <p className="text-base font-semibold mono text-primary">${total.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground text-center">
        Data source: JIRA customfield_11577
      </div>
    </div>
  );
}