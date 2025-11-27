import { Bell, Download, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export function Header() {
  const lastSync = new Date();

  return (
    <header className="flex items-center justify-between mb-8 opacity-0 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time overview of operations and financials
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right mr-4">
          <p className="text-xs text-muted-foreground">Last synced with JIRA</p>
          <p className="text-sm font-medium">{format(lastSync, 'MMM d, yyyy h:mm a')}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Sync Now
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-border">
          <User className="h-5 w-5 text-primary" />
        </div>
      </div>
    </header>
  );
}
