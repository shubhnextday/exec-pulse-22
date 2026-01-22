import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface FilterConfig {
  key: string;
  value: string;
}

export interface UseTableFeaturesOptions<T> {
  data: T[];
  searchableKeys?: (keyof T)[];
  initialSort?: SortConfig<T>;
  initialSearchQuery?: string;
}

export function useTableFeatures<T extends Record<string, any>>({
  data,
  searchableKeys = [],
  initialSort = { key: null, direction: null },
  initialSearchQuery = '',
}: UseTableFeaturesOptions<T>) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialSort);
  const [filters, setFilters] = useState<FilterConfig[]>([]);

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const addFilter = useCallback((key: string, value: string) => {
    setFilters(prev => {
      const existing = prev.findIndex(f => f.key === key);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { key, value };
        return updated;
      }
      return [...prev, { key, value }];
    });
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters(prev => prev.filter(f => f.key !== key));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
    setSearchQuery('');
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery && searchableKeys.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        searchableKeys.some(key => {
          const value = item[key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    filters.forEach(filter => {
      if (filter.value) {
        result = result.filter(item => {
          const value = item[filter.key as keyof T];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(filter.value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchQuery, searchableKeys, filters, sortConfig]);

  return {
    // Data
    filteredData: filteredAndSortedData,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Sort
    sortConfig,
    handleSort,
    
    // Filters
    filters,
    addFilter,
    removeFilter,
    clearFilters,
  };
}
