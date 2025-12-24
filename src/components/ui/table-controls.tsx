import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SortDirection, FilterConfig } from '@/hooks/useTableFeatures';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TableSearch({ value, onChange, placeholder = 'Search...', className }: TableSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 h-9 text-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  currentSortKey: string | null;
  direction: SortDirection;
  onSort: () => void;
  className?: string;
}

export function SortableHeader({ 
  children, 
  sortKey, 
  currentSortKey, 
  direction, 
  onSort,
  className 
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey;

  return (
    <button
      onClick={onSort}
      className={cn(
        "flex items-center gap-1 hover:text-foreground transition-colors text-left font-semibold",
        isActive ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      {children}
      <span className="ml-1">
        {!isActive && <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
        {isActive && direction === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
        {isActive && direction === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

interface TableFilterProps {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function TableFilter({ label, options, value, onChange }: TableFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Filter className="h-3.5 w-3.5" />
          {label}
          {value && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {options.find(o => o.value === value)?.label || value}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onChange('')}>
          All
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem 
            key={option.value} 
            onClick={() => onChange(option.value)}
            className={cn(value === option.value && "bg-primary/10")}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ActiveFiltersProps {
  filters: FilterConfig[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

export function ActiveFilters({ filters, onRemove, onClear }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="gap-1 pr-1">
          {filter.key}: {filter.value}
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={onClear} className="h-6 text-xs">
        Clear all
      </Button>
    </div>
  );
}

interface TableControlsBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onRemoveFilter?: (key: string) => void;
  onClearFilters?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function TableControlsBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  onRemoveFilter,
  onClearFilters,
  children,
  className,
}: TableControlsBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 p-4 border-b border-border/40", className)}>
      <div className="flex items-center gap-3 flex-wrap">
        <TableSearch 
          value={searchValue} 
          onChange={onSearchChange} 
          placeholder={searchPlaceholder}
          className="w-64"
        />
        {children}
      </div>
      {filters.length > 0 && onRemoveFilter && onClearFilters && (
        <ActiveFilters filters={filters} onRemove={onRemoveFilter} onClear={onClearFilters} />
      )}
    </div>
  );
}
