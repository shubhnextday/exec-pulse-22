import { Commission } from '@/types/dashboard';
import { DollarSign } from 'lucide-react';

interface CommissionsTableProps {
  commissions: Commission[];
}

export function CommissionsTable({ commissions }: CommissionsTableProps) {
  const totalDue = commissions.reduce((sum, c) => sum + c.commissionDue, 0);
  const totalPaid = commissions.reduce((sum, c) => sum + c.commissionPaid, 0);

  // Group by agent
  const byAgent = commissions.reduce((acc, comm) => {
    if (!acc[comm.agent]) {
      acc[comm.agent] = { agent: comm.agent, total: 0, count: 0 };
    }
    acc[comm.agent].total += comm.commissionDue;
    acc[comm.agent].count += 1;
    return acc;
  }, {} as Record<string, { agent: string; total: number; count: number }>);

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '800ms' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-accent/10">
          <DollarSign className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Agent Commissions</h3>
          <p className="text-sm text-muted-foreground">Upcoming payouts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">Due This Period</p>
          <p className="text-2xl font-bold text-warning mono">${totalDue.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">Paid This Period</p>
          <p className="text-2xl font-bold text-success mono">${totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <h4 className="text-sm font-medium text-muted-foreground mb-3">By Agent</h4>
      <div className="space-y-3">
        {Object.values(byAgent).map(({ agent, total, count }) => (
          <div key={agent} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <div>
              <p className="font-medium">{agent}</p>
              <p className="text-xs text-muted-foreground">{count} orders</p>
            </div>
            <p className="text-lg font-semibold mono">${total.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
