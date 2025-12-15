import { ShieldX } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Access Denied</h1>
        <p className="text-muted-foreground">
          This dashboard can only be accessed through the authorized portal at{' '}
          <span className="font-medium text-foreground">dashboard.nextdaynutra.com</span>
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
