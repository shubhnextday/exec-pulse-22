import { useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import type { WebProject } from '@/types/dashboard';

interface ActiveProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: WebProject[];
  activeCount?: number;
}

// Status categories for tabs
const STATUS_CATEGORIES = {
  coming_soon: ['Open', 'In Requirements', 'Ready for Scheduling'],
  active: ['Technical Discovery', 'In Technical Discovery', 'In Design', 'In Website Development', 'In Final QA Testing', 'Continuous Development', 'Customer Handover'],
  non_active: ['On Hold', 'Done', 'Canceled'],
};

const STATUS_ORDER: Record<string, number> = {
  'Open': 1,
  'In Requirements': 2,
  'Ready for Scheduling': 3,
  'Technical Discovery': 4,
  'In Technical Discovery': 4,
  'In Design': 5,
  'In Website Development': 6,
  'In Final QA Testing': 7,
  'Continuous Development': 8,
  'Customer Handover': 9,
  'On Hold': 10,
  'Done': 11,
  'Canceled': 12,
};

export function ActiveProjectsDialog({ open, onOpenChange, projects, activeCount }: ActiveProjectsDialogProps) {
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

  const sortedProjects = useMemo(() => {
    if (sortConfig.key) return tabFilteredProjects;
    return [...tabFilteredProjects].sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 99;
      const orderB = STATUS_ORDER[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });
  }, [tabFilteredProjects, sortConfig.key]);

  // Count projects per tab
  const tabCounts = useMemo(() => ({
    coming_soon: projects.filter(p => STATUS_CATEGORIES.coming_soon.includes(p.status)).length,
    active: projects.filter(p => STATUS_CATEGORIES.active.includes(p.status)).length,
    non_active: projects.filter(p => STATUS_CATEGORIES.non_active.includes(p.status)).length,
    all: projects.length,
  }), [projects]);

  const statusOptions = [...new Set(projects.map(p => p.status))].map(s => ({
    label: s,
    value: s,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
      case 'In Requirements':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'In Technical Discovery':
      case 'Technical Discovery':
        return 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30';
      case 'Ready for Scheduling':
        return 'bg-teal-500/20 text-teal-600 border-teal-500/30';
      case 'In Design':
        return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      case 'In Website Development':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'In Final QA Testing':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'Continuous Development':
        return 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30';
      case 'Customer Handover':
        return 'bg-lime-500/20 text-lime-600 border-lime-500/30';
      case 'Done':
        return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'On Hold':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'Canceled':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getHealthColor = (health?: string | null) => {
    if (!health) return 'bg-muted text-muted-foreground border-muted-foreground/30';
    const h = health.toLowerCase();
    if (h.includes('on track') || h.includes('on-track') || h === 'good') {
      return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
    }
    if (h.includes('at risk') || h.includes('at-risk') || h === 'warning') {
      return 'bg-warning/20 text-warning border-warning/30';
    }
    if (h.includes('off track') || h.includes('off-track') || h === 'critical') {
      return 'bg-destructive/20 text-destructive border-destructive/30';
    }
    return 'bg-muted text-muted-foreground border-muted-foreground/30';
  };

  const renderTable = () => (
    <div className="h-[40vh] overflow-auto">
      <Table>
        <TableHeader className="bg-background [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background">
          <TableRow className="border-b border-border">
            <TableHead className="w-[100px]">
              <SortableHeader
                sortKey="projectHealth"
                currentSortKey={sortConfig.key as string}
                direction={sortConfig.direction}
                onSort={() => handleSort('projectHealth')}
              >
                Health
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader
                sortKey="epicName"
                currentSortKey={sortConfig.key as string}
                direction={sortConfig.direction}
                onSort={() => handleSort('epicName')}
              >
                Epic Name (Project)
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader
                sortKey="status"
                currentSortKey={sortConfig.key as string}
                direction={sortConfig.direction}
                onSort={() => handleSort('status')}
              >
                Status
              </SortableHeader>
            </TableHead>
            <TableHead colSpan={2}>Progress</TableHead>
            <TableHead className="text-center">
              <SortableHeader
                sortKey="totalTasks"
                currentSortKey={sortConfig.key as string}
                direction={sortConfig.direction}
                onSort={() => handleSort('totalTasks')}
              >
                Total Tasks
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader
                sortKey="dueDate"
                currentSortKey={sortConfig.key as string}
                direction={sortConfig.direction}
                onSort={() => handleSort('dueDate')}
              >
                Due Date
              </SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <Badge variant="outline" className={getHealthColor(project.projectHealth)}>
                  {project.projectHealth || '-'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{project.epicName}</div>
                <div className="text-xs text-muted-foreground">{project.epicKey}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell className="min-w-[120px]">
                {['Open', 'In Requirements', 'Technical Discovery', 'In Technical Discovery', 'Ready for Scheduling'].includes(project.status) ? (
                  <span className="text-muted-foreground text-sm">-</span>
                ) : (
                  (() => {
                    const safePercent = Math.min(100, Math.max(0, project.percentComplete || 0));
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
                  })()
                )}
              </TableCell>
              <TableCell>
                {['Open', 'In Requirements', 'Technical Discovery', 'In Technical Discovery', 'Ready for Scheduling'].includes(project.status) ? (
                  <span className="text-muted-foreground text-sm">-</span>
                ) : (
                  <span className="mono font-medium text-sm text-primary">
                    {Number.isInteger(project.percentComplete) 
                      ? `${project.percentComplete}%` 
                      : `${project.percentComplete.toFixed(2)}%`}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {project.totalTasks}
              </TableCell>
              <TableCell>
                {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '-'}
              </TableCell>
            </TableRow>
          ))}
          {sortedProjects.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No projects found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Web Development Projects ({projects.length})
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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

          <TableControlsBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search projects..."
            filters={filters}
            onRemoveFilter={removeFilter}
            onClearFilters={clearFilters}
            className="px-0 border-b-0 mt-4"
          >
            <TableFilter
              label="Status"
              options={statusOptions}
              value={filters.find(f => f.key === 'status')?.value || ''}
              onChange={(value) => value ? addFilter('status', value) : removeFilter('status')}
            />
          </TableControlsBar>

          <TabsContent value="coming_soon" className="mt-0">
            {renderTable()}
          </TabsContent>
          <TabsContent value="active" className="mt-0">
            {renderTable()}
          </TabsContent>
          <TabsContent value="non_active" className="mt-0">
            {renderTable()}
          </TabsContent>
          <TabsContent value="all" className="mt-0">
            {renderTable()}
          </TabsContent>
        </Tabs>

        <div className="text-sm text-muted-foreground pt-2 border-t">
          Showing {sortedProjects.length} of {projects.length} projects
        </div>
      </DialogContent>
    </Dialog>
  );
}