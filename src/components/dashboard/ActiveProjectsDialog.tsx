import { useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TableControlsBar, SortableHeader, TableFilter } from '@/components/ui/table-controls';
import { useTableFeatures } from '@/hooks/useTableFeatures';
import type { WebProject } from '@/types/dashboard';

interface ActiveProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: WebProject[];
}

const STATUS_ORDER: Record<string, number> = {
  Open: 1,
  'In Requirements': 2,
  'In Technical Discovery': 3,
  'Technical Discovery': 3,
  'Ready for Scheduling': 4,
  'In Design': 5,
  'In Website Development': 6,
  'In Final QA Testing': 7,
  'Continuous Development': 8,
  'Customer Handover': 9,
  Done: 10,
  'On Hold': 11,
  Canceled: 12,
};

export function ActiveProjectsDialog({ open, onOpenChange, projects }: ActiveProjectsDialogProps) {
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

  const activeProjects = projects.filter((p) => !['Done', 'Canceled', 'On Hold'].includes(p.status));
  const totalTasks = activeProjects.reduce((sum, p) => sum + p.totalTasks, 0);
  const completedTasks = activeProjects.reduce((sum, p) => sum + p.completed, 0);

  const sortedProjects = useMemo(() => {
    if (sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 99;
      const orderB = STATUS_ORDER[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });
  }, [filteredData, sortConfig.key]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Active Projects ({activeProjects.length})
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Active Projects</div>
            <div className="text-xl font-bold text-primary">{activeProjects.length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Tasks</div>
            <div className="text-xl font-bold">{totalTasks}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-xl font-bold text-emerald-600">{completedTasks}</div>
          </div>
        </div>

        <TableControlsBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search projects..."
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
          className="px-0 border-b-0"
        >
          <TableFilter
            label="Status"
            options={statusOptions}
            value={filters.find(f => f.key === 'status')?.value || ''}
            onChange={(value) => value ? addFilter('status', value) : removeFilter('status')}
          />
        </TableControlsBar>

        <ScrollArea className="h-[40vh]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>
                  <SortableHeader
                    sortKey="epicName"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('epicName')}
                  >
                    Project
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
                <TableHead>Progress</TableHead>
                <TableHead className="text-center">
                  <SortableHeader
                    sortKey="totalTasks"
                    currentSortKey={sortConfig.key as string}
                    direction={sortConfig.direction}
                    onSort={() => handleSort('totalTasks')}
                  >
                    Tasks
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
                    <div className="font-medium">{project.epicName}</div>
                    <div className="text-xs text-muted-foreground">{project.epicKey}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Progress value={project.percentComplete} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-10">{project.percentComplete}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {project.completed}/{project.totalTasks}
                  </TableCell>
                  <TableCell>
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {sortedProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="text-sm text-muted-foreground pt-2 border-t">
          Showing {sortedProjects.length} of {projects.length} projects
        </div>
      </DialogContent>
    </Dialog>
  );
}
