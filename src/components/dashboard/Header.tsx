import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

interface HeaderProps {
  lastSynced?: string | null;
  onRefresh?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export function Header({ lastSynced, onRefresh, onExport, isLoading }: HeaderProps) {
  const syncTime = lastSynced ? parseISO(lastSynced) : new Date();

  return (
    <header className="flex items-center justify-between mb-8 opacity-0 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time overview of operations and financials
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right mr-2 pr-4 border-r border-border/30">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last synced</p>
          <p className="text-sm font-medium text-foreground">{format(syncTime, 'MMM d, h:mm a')}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 bg-muted/30 border-border/30 hover:border-primary/50 hover:bg-primary/5 hover:text-[#F05323]"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? 'Syncing...' : 'Sync'}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 bg-muted/30 border-border/30 hover:border-primary/50 hover:bg-primary/5 hover:text-[#F05323]"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </header>
  );
}
