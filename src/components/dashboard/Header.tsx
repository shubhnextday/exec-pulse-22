import { Bell, Download, RefreshCw, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

interface HeaderProps {
  lastSynced?: string | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function Header({ lastSynced, onRefresh, isLoading }: HeaderProps) {
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
          className="h-9 gap-2 bg-muted/30 border-border/30 hover:border-primary/50 hover:bg-primary/5"
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
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-muted/30 border-border/30 hover:border-primary/50 hover:bg-primary/5">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#F05323' }} />
        </Button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-border/30" style={{ backgroundColor: 'rgba(93, 121, 150, 0.1)' }}>
          <User className="h-4 w-4" style={{ color: '#5d7996' }} />
        </div>
      </div>
    </header>
  );
}
