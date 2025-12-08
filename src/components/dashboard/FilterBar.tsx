import { useState } from 'react';
import { Calendar, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfMonth, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  customers: string[];
  agents: string[];
  accountManagers: string[];
  selectedCustomer: string;
  selectedAgent: string;
  selectedAccountManager: string;
  dateFrom: Date;
  dateTo: Date;
  onCustomerChange: (value: string) => void;
  onAgentChange: (value: string) => void;
  onAccountManagerChange: (value: string) => void;
  onDateFromChange: (date: Date) => void;
  onDateToChange: (date: Date) => void;
}

export function FilterBar({
  customers,
  agents,
  accountManagers,
  selectedCustomer,
  selectedAgent,
  selectedAccountManager,
  dateFrom,
  dateTo,
  onCustomerChange,
  onAgentChange,
  onAccountManagerChange,
  onDateFromChange,
  onDateToChange,
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

  // Max 90 days range
  const maxDaysRange = 90;
  const daysDiff = differenceInDays(dateTo, dateFrom);
  const isRangeValid = daysDiff >= 0 && daysDiff <= maxDaysRange;

  // Quick presets
  const setCurrentMonth = () => {
    onDateFromChange(startOfMonth(new Date()));
    onDateToChange(new Date());
  };

  const setLast30Days = () => {
    onDateFromChange(subDays(new Date(), 30));
    onDateToChange(new Date());
  };

  const setLast90Days = () => {
    onDateFromChange(subDays(new Date(), 90));
    onDateToChange(new Date());
  };

  return (
    <div className="rounded-2xl border border-border/30 p-4 mb-6 opacity-0 animate-slide-up bg-card/50" style={{ animationDelay: '100ms' }}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground pr-3 border-r border-border/30">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>
        
        {/* Date Range with Presets */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 text-sm bg-muted/30 border-border/30 hover:border-primary/30 transition-colors justify-start text-left font-normal",
                  !isRangeValid && "border-destructive/50"
                )}
              >
                <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                {format(dateFrom, "MMM d")} - {format(dateTo, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b border-border/30">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={setCurrentMonth} className="text-xs">
                    This Month
                  </Button>
                  <Button variant="outline" size="sm" onClick={setLast30Days} className="text-xs">
                    Last 30 Days
                  </Button>
                  <Button variant="outline" size="sm" onClick={setLast90Days} className="text-xs">
                    Last 90 Days
                  </Button>
                </div>
                {!isRangeValid && (
                  <p className="text-xs text-destructive mt-2">Max range is 90 days</p>
                )}
              </div>
              <div className="flex">
                <div className="border-r border-border/30">
                  <p className="text-xs text-muted-foreground p-2 text-center">From</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && onDateFromChange(date)}
                    disabled={(date) => date > dateTo || date > new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground p-2 text-center">To</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && onDateToChange(date)}
                    disabled={(date) => date < dateFrom || date > new Date() || differenceInDays(date, dateFrom) > maxDaysRange}
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

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
