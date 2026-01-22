import { WebProject, EpicStatus } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Code2, PauseCircle, PlayCircle, Clock, Palette, Monitor, TestTube, RefreshCw, XCircle, FileText, Bug, Users, User, Activity } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useMemo } from 'react';
import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import { Badge } from '@/components/ui/badge';

interface WebProjectsTableProps {
  projects: WebProject[];
}

// Workflow order for sorting - Open comes after Continuous Dev and before Done
const STATUS_ORDER: Record<string, number> = {
  'In Requirements': 1,
  'In Design': 2,
  'In Website Development': 3,
  'In Final QA Testing': 4,
  'Continuous Development': 5,
  'Open': 6,
  'Done': 7,
  'On Hold': 8,
  'Canceled': 9,
};

function StatusBadge({ status, isOffTrack }: { status: EpicStatus; isOffTrack: boolean }) {
  if (isOffTrack) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border status-off-track">
        <AlertTriangle className="h-3 w-3" />
        Off Track
      </span>
    );
  }

  const config: Record<string, { icon: typeof PlayCircle; className: string; label: string }> = {
    'Open': { 
      icon: Clock, 
      className: 'bg-muted text-muted-foreground border-muted-foreground/30',
      label: 'Open'
    },
    'In Requirements': { 
      icon: FileText, 
      className: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
      label: 'In Requirements'
    },
    'In Design': { 
      icon: Palette, 
      className: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
      label: 'In Design'
    },
    'In Website Development': { 
      icon: Monitor, 
      className: 'bg-primary/15 text-primary border-primary/30',
      label: 'In Development'
    },
    'In Final QA Testing': { 
      icon: TestTube, 
      className: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      label: 'In QA Testing'
    },
    'Continuous Development': { 
      icon: RefreshCw, 
      className: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
      label: 'Continuous Dev'
    },
    'Done': { 
      icon: CheckCircle2, 
      className: 'bg-success/15 text-success border-success/30',
      label: 'Done'
    },
    'On Hold': { 
      icon: PauseCircle, 
      className: 'bg-warning/15 text-warning border-warning/30',
      label: 'On Hold'
    },
    'Canceled': { 
      icon: XCircle, 
      className: 'bg-destructive/15 text-destructive border-destructive/30',
      label: 'Canceled'
    },
  };

  const statusConfig = config[status] || { 
    icon: PlayCircle, 
    className: 'bg-muted text-muted-foreground border-muted-foreground/30',
    label: status 
  };

  const { icon: Icon, className, label } = statusConfig;

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

function ProjectHealthBadge({ health }: { health?: string | null }) {
  if (!health) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }
  
  const lower = health.toLowerCase();
  let className = 'bg-muted text-muted-foreground';
  
  if (lower.includes('on track') || lower.includes('on-track') || lower.includes('healthy')) {
    className = 'bg-success/15 text-success border-success/30';
  } else if (lower.includes('at risk') || lower.includes('at-risk')) {
    className = 'bg-warning/15 text-warning border-warning/30';
  } else if (lower.includes('off track') || lower.includes('off-track') || lower.includes('critical')) {
    className = 'bg-destructive/15 text-destructive border-destructive/30';
  }
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      className
    )}>
      {health}
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
    data: projects,
    searchableKeys: ['epicName', 'epicKey', 'status'],
  });

  // Sort projects by workflow order when no custom sort
  const sortedProjects = useMemo(() => {
    if (sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 99;
      const orderB = STATUS_ORDER[b.status] ?? 99;
      return orderA - orderB;
    });
  }, [filteredData, sortConfig.key]);

  const activeProjects = projects.filter(p => 
    !['Done', 'Canceled', 'On Hold'].includes(p.status)
  ).length;
  const offTrackCount = projects.filter(p => p.isOffTrack).length;

  const statusOptions = [...new Set(projects.map(p => p.status))].map(s => ({
    label: s,
    value: s,
  }));

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

      <TableControlsBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search projects..."
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearFilters}
      />
      
      {sortedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Code2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No projects found</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="min-w-[1400px]">
            <table className="data-table w-full">
              <thead className="sticky top-0 z-10">
              <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[100px]">
                    <SortableHeader
                      sortKey="projectHealth"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('projectHealth')}
                    >
                      Health
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[200px]">
                    <SortableHeader
                      sortKey="epicName"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('epicName')}
                    >
                      Epic Name
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[140px]">
                    <SortableHeader
                      sortKey="status"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('status')}
                    >
                      Status
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[100px]">
                    <SortableHeader
                      sortKey="startDate"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('startDate')}
                    >
                      Start Date
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[100px]">
                    <SortableHeader
                      sortKey="dueDate"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('dueDate')}
                    >
                      Due Date
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[120px]">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[90px]">
                    <SortableHeader
                      sortKey="totalTasks"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('totalTasks')}
                    >
                      Total Tasks
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[70px]">
                    <SortableHeader
                      sortKey="totalBugs"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('totalBugs')}
                    >
                      Bugs
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[120px]">
                    <SortableHeader
                      sortKey="projectLead"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('projectLead')}
                    >
                      Project Lead
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[120px]">
                    <SortableHeader
                      sortKey="devLead"
                      currentSortKey={sortConfig.key as string}
                      direction={sortConfig.direction}
                      onSort={() => handleSort('devLead')}
                    >
                      Dev Lead
                    </SortableHeader>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <ProjectHealthBadge health={project.projectHealth} />
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <div className="truncate">
                        <p className="font-medium text-foreground truncate">{project.epicName}</p>
                        <p className="text-[11px] text-muted-foreground mono truncate">{project.epicKey}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <StatusBadge status={project.status} isOffTrack={project.isOffTrack} />
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30 text-sm truncate">
                      {project.startDate || '-'}
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30 text-sm truncate">
                      {project.dueDate || '-'}
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <ProgressBar 
                          notStarted={project.notStarted}
                          inProgress={project.inProgress}
                          completed={project.completed}
                          total={project.totalTasks}
                        />
                        <span className={cn(
                          "mono font-medium text-xs min-w-[40px]",
                          project.percentComplete >= 75 && "text-success",
                          project.percentComplete >= 50 && project.percentComplete < 75 && "text-primary",
                          project.percentComplete < 50 && "text-muted-foreground"
                        )}>
                          {project.percentComplete}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30 mono text-sm text-center">
                      {project.totalTasks}
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30">
                      <span className={cn(
                        "mono text-sm",
                        (project.totalBugs || 0) > 0 && "text-destructive font-medium"
                      )}>
                        {project.totalBugs || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30 text-sm truncate">
                      {project.projectLead || '-'}
                    </td>
                    <td className="px-4 py-3.5 border-t border-border/30 text-sm truncate">
                      {project.devLead || '-'}
                    </td>
                  </tr>
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
