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
import type { WebProject } from '@/types/dashboard';

interface ActiveProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: WebProject[];
}

export function ActiveProjectsDialog({ open, onOpenChange, projects }: ActiveProjectsDialogProps) {
  const activeProjects = projects.filter(p => p.status === 'active');
  const totalTasks = activeProjects.reduce((sum, p) => sum + p.totalTasks, 0);
  const completedTasks = activeProjects.reduce((sum, p) => sum + p.completed, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'on-hold':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'complete':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
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
        
        <ScrollArea className="h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-center">Tasks</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
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
                      <span className="text-xs text-muted-foreground w-10">
                        {project.percentComplete}%
                      </span>
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
              {projects.length === 0 && (
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
          Showing all {projects.length} web development projects
        </div>
      </DialogContent>
    </Dialog>
  );
}