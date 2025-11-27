import { Calendar, ChevronDown, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

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
  return (
    <div className="glass rounded-xl p-4 mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">Current Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-90-days">Last 90 Days</SelectItem>
            <SelectItem value="nov-2025">Nov 2025+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCustomer} onValueChange={onCustomerChange}>
          <SelectTrigger className="w-[200px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer} value={customer}>
                {customer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAgent} onValueChange={onAgentChange}>
          <SelectTrigger className="w-[160px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAccountManager} onValueChange={onAccountManagerChange}>
          <SelectTrigger className="w-[200px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Account Manager" />
          </SelectTrigger>
          <SelectContent>
            {accountManagers.map((am) => (
              <SelectItem key={am} value={am}>
                {am}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" className="bg-muted/50 border-border/50">
          <Search className="h-4 w-4 mr-2" />
          Search Orders
        </Button>
      </div>
    </div>
  );
}
