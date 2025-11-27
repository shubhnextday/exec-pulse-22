import { TeamMember } from '@/types/dashboard';
import { User } from 'lucide-react';

interface TeamWorkloadProps {
  members: TeamMember[];
}

export function TeamWorkload({ members }: TeamWorkloadProps) {
  const maxTasks = Math.max(...members.map(m => m.openTasks));

  return (
    <div className="metric-card opacity-0 animate-slide-up" style={{ animationDelay: '700ms' }}>
      <h3 className="text-lg font-semibold mb-4">Team Workload</h3>
      <p className="text-sm text-muted-foreground mb-6">Open tasks by team member</p>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium truncate">{member.name}</p>
                <span className="text-sm mono text-muted-foreground">{member.openTasks}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${(member.openTasks / maxTasks) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border/30">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Open Tasks</span>
          <span className="font-semibold mono">
            {members.reduce((sum, m) => sum + m.openTasks, 0)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-muted-foreground">Completed This Month</span>
          <span className="font-semibold mono text-success">
            {members.reduce((sum, m) => sum + m.completedThisMonth, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
