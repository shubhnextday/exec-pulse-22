import { Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';

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
        
        {/* Date Range */}
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-[180px] h-9 text-sm bg-muted/30 border-border/30 hover:border-primary/30 transition-colors">
            <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border z-[100]">
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-30-days">Last 30 Days</SelectItem>
            <SelectItem value="last-60-days">Last 60 Days</SelectItem>
            <SelectItem value="last-6-months">Last 6 Months</SelectItem>
            <SelectItem value="nov-2025">November 2025</SelectItem>
            <SelectItem value="dec-2025">December 2025</SelectItem>
          </SelectContent>
        </Select>

        {/* Customer - Searchable */}
        <SearchableSelect
          options={customers}
          value={selectedCustomer}
          onValueChange={onCustomerChange}
          placeholder="Customer"
          searchPlaceholder="Search customers..."
          className="w-[180px] h-9 text-sm"
          allLabel="All Customers"
        />

        {/* Agent - Searchable */}
        <SearchableSelect
          options={agents}
          value={selectedAgent}
          onValueChange={onAgentChange}
          placeholder="Agent"
          searchPlaceholder="Search agents..."
          className="w-[140px] h-9 text-sm"
          allLabel="All Agents"
        />

        {/* Account Manager - Searchable */}
        <SearchableSelect
          options={accountManagers}
          value={selectedAccountManager}
          onValueChange={onAccountManagerChange}
          placeholder="Account Manager"
          searchPlaceholder="Search account managers..."
          className="w-[180px] h-9 text-sm"
          allLabel="All Account Managers"
        />

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
      </div>
    </div>
  );
}
