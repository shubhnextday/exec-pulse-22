import { TeamMember } from '@/types/dashboard';
import { User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TeamWorkloadProps {
  members: TeamMember[];
}

export function TeamWorkload({ members }: TeamWorkloadProps) {
  const maxTasks = Math.max(...members.map(m => m.openTasks), 1);
  const totalOpen = members.reduce((sum, m) => sum + m.openTasks, 0);
  const totalCompleted = members.reduce((sum, m) => sum + m.completedThisMonth, 0);

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '700ms' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Team Workload</h3>
          <p className="text-sm text-muted-foreground">Orders by agent (from JIRA)</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-muted/30 border border-border/30">
        <div>
          <p className="text-xs text-muted-foreground">Open Orders</p>
          <p className="text-lg font-bold mono text-warning">{totalOpen}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-lg font-bold mono text-success">{totalCompleted}</p>
        </div>
      </div>

      <ScrollArea className="h-[200px] pr-2">
        <div className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No agents found in current filter
            </p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate" title={member.name}>{member.name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="mono text-warning">{member.openTasks} open</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="mono text-success">{member.completedThisMonth} done</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${(member.openTasks / maxTasks) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground text-center">
        Data source: JIRA Agent field (customfield_11573)
      </div>
    </div>
  );
}