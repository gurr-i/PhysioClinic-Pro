import { useState, useEffect, useMemo } from 'react';

export interface UseDebounceSearchOptions {
  delay?: number;
  minLength?: number;
}

export function useDebounceSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  options: UseDebounceSearchOptions = {}
) {
  const { delay = 300, minLength = 1 } = options;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search term
  useEffect(() => {
    if (searchTerm.length === 0) {
      setDebouncedSearchTerm('');
      setIsSearching(false);
      return;
    }

    if (searchTerm.length < minLength) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay, minLength]);

  // Filter items based on debounced search term
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < minLength) {
      return items;
    }

    const lowercaseSearch = debouncedSearchTerm.toLowerCase();
    
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value == null) return false;
        
        return String(value).toLowerCase().includes(lowercaseSearch);
      })
    );
  }, [items, debouncedSearchTerm, searchFields, minLength]);

  // Highlight matching text in search results
  const highlightMatch = (text: string, highlight: string = debouncedSearchTerm): string => {
    if (!highlight || !text) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    filteredItems,
    highlightMatch,
    hasResults: filteredItems.length > 0,
    isEmpty: debouncedSearchTerm.length >= minLength && filteredItems.length === 0,
  };
}

// Hook for advanced filtering with multiple criteria
export interface FilterCriteria {
  [key: string]: any;
}

export function useAdvancedFilter<T>(
  items: T[],
  searchFields: (keyof T)[],
  filterCriteria: FilterCriteria = {},
  searchOptions: UseDebounceSearchOptions = {}
) {
  const searchResult = useDebounceSearch(items, searchFields, searchOptions);
  
  // Apply additional filters
  const filteredAndSearchedItems = useMemo(() => {
    let result = searchResult.filteredItems;
    
    // Apply each filter criteria
    Object.entries(filterCriteria).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        result = result.filter((item) => {
          const itemValue = (item as any)[key];
          
          // Handle different comparison types
          if (typeof value === 'string') {
            return String(itemValue).toLowerCase().includes(value.toLowerCase());
          } else if (typeof value === 'boolean') {
            return Boolean(itemValue) === value;
          } else if (Array.isArray(value)) {
            return value.includes(itemValue);
          } else {
            return itemValue === value;
          }
        });
      }
    });
    
    return result;
  }, [searchResult.filteredItems, filterCriteria]);

  return {
    ...searchResult,
    filteredItems: filteredAndSearchedItems,
    hasResults: filteredAndSearchedItems.length > 0,
    isEmpty: (searchResult.debouncedSearchTerm.length >= (searchOptions.minLength || 1) || 
              Object.values(filterCriteria).some(v => v && v !== 'all' && v !== '')) && 
             filteredAndSearchedItems.length === 0,
  };
}

// Hook for search history
export function useSearchHistory(maxHistory: number = 10) {
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('search-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = (term: string) => {
    if (!term.trim() || term.length < 2) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== term);
      const newHistory = [term, ...filtered].slice(0, maxHistory);
      
      try {
        localStorage.setItem('search-history', JSON.stringify(newHistory));
      } catch {
        // Ignore localStorage errors
      }
      
      return newHistory;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('search-history');
    } catch {
      // Ignore localStorage errors
    }
  };

  return {
    searchHistory,
    addToHistory,
    clearHistory,
  };
}
