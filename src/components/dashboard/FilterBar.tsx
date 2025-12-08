import { Calendar, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
  customers: string[];
  agents: string[];
  accountManagers: string[];
  selectedCustomer: string;
  selectedAgent: string;
  selectedAccountManager: string;
  dateRange: string;
  onCustomerChange: (value: string) => void;
  onAgentChange: (value: string) => void;
  onAccountManagerChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
}

export function FilterBar({
  customers,
  agents,
  accountManagers,
  selectedCustomer,
  selectedAgent,
  selectedAccountManager,
  dateRange,
  onCustomerChange,
  onAgentChange,
  onAccountManagerChange,
  onDateRangeChange,
}: FilterBarProps) {
  const hasActiveFilters = 
    selectedCustomer !== 'All Customers' || 
    selectedAgent !== 'All Agents' || 
    selectedAccountManager !== 'All Account Managers';

  const clearFilters = () => {
    onCustomerChange('All Customers');
    onAgentChange('All Agents');
    onAccountManagerChange('All Account Managers');
  };

  return (
    <div className="rounded-2xl border border-border/30 p-4 mb-6 opacity-0 animate-slide-up bg-card/50" style={{ animationDelay: '100ms' }}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground pr-3 border-r border-border/30">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>
        
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-muted/30 border-border/30 hover:border-primary/30 transition-colors">
            <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50">
            <SelectItem value="current-month">Current Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-90-days">Last 90 Days</SelectItem>
            <SelectItem value="nov-2025">Nov 2025+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCustomer} onValueChange={onCustomerChange}>
          <SelectTrigger className={`w-[180px] h-9 text-sm bg-muted/30 border-border/30 hover:border-primary/30 transition-colors ${selectedCustomer !== 'All Customers' ? 'border-primary/50 bg-primary/5' : ''}`}>
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50 max-h-[300px]">
            {customers.map((customer) => (
              <SelectItem key={customer} value={customer}>
                {customer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAgent} onValueChange={onAgentChange}>
          <SelectTrigger className={`w-[140px] h-9 text-sm bg-muted/30 border-border/30 hover:border-primary/30 transition-colors ${selectedAgent !== 'All Agents' ? 'border-primary/50 bg-primary/5' : ''}`}>
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50">
            {agents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAccountManager} onValueChange={onAccountManagerChange}>
          <SelectTrigger className={`w-[180px] h-9 text-sm bg-muted/30 border-border/30 hover:border-primary/30 transition-colors ${selectedAccountManager !== 'All Account Managers' ? 'border-primary/50 bg-primary/5' : ''}`}>
            <SelectValue placeholder="Account Manager" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50">
            {accountManagers.map((am) => (
              <SelectItem key={am} value={am}>
                {am}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear Filters
          </Button>
        )}

        <div className="flex-1" />

        <Button 
          className="h-9 text-sm font-medium"
          style={{ backgroundColor: '#F05323' }}
        >
          <Search className="h-3.5 w-3.5 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
}
