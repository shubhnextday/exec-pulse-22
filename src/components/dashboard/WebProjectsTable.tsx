import { WebProject, EpicStatus } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Code2, PauseCircle, PlayCircle, Clock, Palette, Monitor, TestTube, RefreshCw, XCircle, FileText, Bug, Users, User, Activity } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useMemo, useState } from 'react';
import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WebProjectsTableProps {
  projects: WebProject[];
}

// Status categories for tabs
const STATUS_CATEGORIES = {
  coming_soon: ['Open', 'In Requirements', 'Technical Discovery', 'In Technical Discovery', 'Ready for Scheduling'],
  active: ['In Design', 'In Website Development', 'In Final QA Testing', 'Continuous Development', 'Customer Handover'],
  non_active: ['On Hold', 'Done', 'Canceled'],
};

// Workflow order for sorting - matches tab order
const STATUS_ORDER: Record<string, number> = {
  'Open': 1,
  'In Requirements': 2,
  'Technical Discovery': 3,
  'In Technical Discovery': 3,
  'Ready for Scheduling': 4,
  'In Design': 5,
  'In Website Development': 6,
  'In Final QA Testing': 7,
  'Continuous Development': 8,
  'Customer Handover': 9,
  'On Hold': 10,
  'Done': 11,
  'Canceled': 12,
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
  percentComplete 
}: { 
  percentComplete: number;
}) {
  const safePercent = Math.min(100, Math.max(0, percentComplete || 0));
  const remaining = 100 - safePercent;
  
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-muted/50 min-w-[100px] w-[120px]">
      {safePercent > 0 && (
        <div 
          className="bg-success transition-all duration-500 rounded-l-full" 
          style={{ width: `${safePercent}%` }}
        />
      )}
      {remaining > 0 && (
        <div 
          className="bg-muted-foreground/30 transition-all duration-500 rounded-r-full" 
          style={{ width: `${remaining}%` }}
        />
      )}
    </div>
  );
}

export function WebProjectsTable({ projects }: WebProjectsTableProps) {
  const [activeTab, setActiveTab] = useState('active');
  
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

  // Filter projects by current tab
  const tabFilteredProjects = useMemo(() => {
    if (activeTab === 'all') return filteredData;
    const categoryStatuses = STATUS_CATEGORIES[activeTab as keyof typeof STATUS_CATEGORIES] || [];
    return filteredData.filter(p => categoryStatuses.includes(p.status));
  }, [filteredData, activeTab]);

  // Sort projects by workflow order when no custom sort
  const sortedProjects = useMemo(() => {
    if (sortConfig.key) return tabFilteredProjects;
    return [...tabFilteredProjects].sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 99;
      const orderB = STATUS_ORDER[b.status] ?? 99;
      return orderA - orderB;
    });
  }, [tabFilteredProjects, sortConfig.key]);

  // Count projects per tab
  const tabCounts = useMemo(() => ({
    coming_soon: projects.filter(p => STATUS_CATEGORIES.coming_soon.includes(p.status)).length,
    active: projects.filter(p => STATUS_CATEGORIES.active.includes(p.status)).length,
    non_active: projects.filter(p => STATUS_CATEGORIES.non_active.includes(p.status)).length,
    all: projects.length,
  }), [projects]);

  const offTrackCount = projects.filter(p => p.isOffTrack).length;

  const renderTable = () => (
    sortedProjects.length === 0 ? (
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
                <th colSpan={2} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 min-w-[160px]">
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
                    {STATUS_CATEGORIES.coming_soon.includes(project.status) ? (
                      <span className="text-muted-foreground text-sm">-</span>
                    ) : (
                      <ProgressBar 
                        percentComplete={project.percentComplete}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3.5 border-t border-border/30 text-center">
                    {STATUS_CATEGORIES.coming_soon.includes(project.status) ? (
                      <span className="text-muted-foreground text-sm">-</span>
                    ) : (
                      <span className="mono font-medium text-sm text-blue-500">
                        {project.percentComplete}%
                      </span>
                    )}
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
    )
  );

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
                {tabCounts.active} active • {offTrackCount} need attention
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              Complete
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              Remaining
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="coming_soon" className="text-xs">
              Coming Soon ({tabCounts.coming_soon})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              Active ({tabCounts.active})
            </TabsTrigger>
            <TabsTrigger value="non_active" className="text-xs">
              Non-Active ({tabCounts.non_active})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All ({tabCounts.all})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <TableControlsBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search projects..."
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearFilters}
      />
      
      {renderTable()}
    </div>
  );
}