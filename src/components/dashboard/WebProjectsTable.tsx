import { WebProject, EpicStatus } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Code2, PauseCircle, PlayCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WebProjectsTableProps {
  projects: WebProject[];
}

function StatusBadge({ status, isOffTrack }: { status: EpicStatus; isOffTrack: boolean }) {
  if (isOffTrack) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border status-off-track">
        <AlertTriangle className="h-3 w-3" />
        Off Track
      </span>
    );
  }

  const config = {
    'active': { 
      icon: PlayCircle, 
      className: 'bg-primary/15 text-primary border-primary/30',
      label: 'Active'
    },
    'on-hold': { 
      icon: PauseCircle, 
      className: 'bg-warning/15 text-warning border-warning/30',
      label: 'On Hold'
    },
    'complete': { 
      icon: CheckCircle2, 
      className: 'bg-success/15 text-success border-success/30',
      label: 'Complete'
    },
  };

  const { icon: Icon, className, label } = config[status];

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
      className
    )}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ProgressBar({ 
  notStarted, 
  inProgress, 
  completed, 
  total 
}: { 
  notStarted: number;
  inProgress: number;
  completed: number;
  total: number;
}) {
  return (
    <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-muted/50">
      <div 
        className="bg-success transition-all duration-500" 
        style={{ width: `${(completed / total) * 100}%` }}
      />
      <div 
        className="bg-primary transition-all duration-500" 
        style={{ width: `${(inProgress / total) * 100}%` }}
      />
      <div 
        className="bg-muted-foreground/30 transition-all duration-500" 
        style={{ width: `${(notStarted / total) * 100}%` }}
      />
    </div>
  );
}

export function WebProjectsTable({ projects }: WebProjectsTableProps) {
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const offTrackCount = projects.filter(p => p.isOffTrack).length;

  return (
    <div className="metric-card opacity-0 animate-slide-up !p-0 overflow-hidden" style={{ animationDelay: '600ms' }}>
      <div className="p-5 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container icon-container-secondary">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Web Development Projects</h3>
              <p className="text-xs text-muted-foreground">
                {activeProjects} active • {offTrackCount} need attention
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              Complete
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              In Progress
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              Not Started
            </div>
          </div>
        </div>
      </div>
      
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Code2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No projects found</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Epic</th>
                  <th>Status</th>
                  <th>Tasks</th>
                  <th className="w-[180px]">Progress</th>
                  <th>% Complete</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <div>
                        <p className="font-medium text-foreground">{project.epicName}</p>
                        <p className="text-[11px] text-muted-foreground mono">{project.epicKey}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <StatusBadge status={project.status} isOffTrack={project.isOffTrack} />
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30 mono text-sm">
                      {project.totalTasks}
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <ProgressBar 
                        notStarted={project.notStarted}
                        inProgress={project.inProgress}
                        completed={project.completed}
                        total={project.totalTasks}
                      />
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <span className={cn(
                        "mono font-medium",
                        project.percentComplete >= 75 && "text-success",
                        project.percentComplete >= 50 && project.percentComplete < 75 && "text-primary",
                        project.percentComplete < 50 && "text-muted-foreground"
                      )}>
                        {project.percentComplete}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30 text-sm">
                      {project.dueDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}