import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';

export interface SearchSuggestion {
  id: string;
  text: string;
  category?: string;
  count?: number;
}

export interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  popularSearches?: string[];
  showSuggestions?: boolean;
  debounceMs?: number;
  minLength?: number;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onClear?: () => void;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  isLoading = false,
  suggestions = [],
  recentSearches = [],
  popularSearches = [],
  showSuggestions = true,
  debounceMs = 300,
  minLength = 1,
  className,
  disabled = false,
  autoFocus = false,
  onClear,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (showSuggestions) {
      setShowDropdown(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 150);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (showSuggestions && newValue.length >= minLength) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowDropdown(false);
    onSearch?.(suggestion);
    inputRef.current?.blur();
  };

  // Handle clear
  const handleClear = () => {
    onChange('');
    setShowDropdown(false);
    onClear?.();
    inputRef.current?.focus();
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.(value);
      setShowDropdown(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Filter and combine suggestions
  const filteredSuggestions = suggestions.filter(s =>
    s.text.toLowerCase().includes(value.toLowerCase())
  );

  const filteredRecent = recentSearches.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  );

  const filteredPopular = popularSearches.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  );

  const hasAnySuggestions = 
    filteredSuggestions.length > 0 || 
    filteredRecent.length > 0 || 
    filteredPopular.length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            'pl-10 pr-10',
            isFocused && 'ring-2 ring-primary/20',
            className
          )}
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && <LoadingSpinner size="sm" />}
          
          {value && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && showSuggestions && (
        <Card 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto shadow-lg"
        >
          <CardContent className="p-0">
            {!hasAnySuggestions && value.length >= minLength && (
              <div className="p-4 text-center text-muted-foreground">
                No suggestions found
              </div>
            )}

            {/* Direct Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="border-b border-border/50">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggestions
                </div>
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full px-3 py-2 text-left hover:bg-accent/50 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {suggestion.text}
                      </span>
                      {suggestion.category && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.category}
                        </Badge>
                      )}
                    </div>
                    {suggestion.count && (
                      <span className="text-xs text-muted-foreground">
                        {suggestion.count} results
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {filteredRecent.length > 0 && (
              <div className="border-b border-border/50">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recent
                </div>
                {filteredRecent.slice(0, 5).map((recent, index) => (
                  <button
                    key={`recent-${index}`}
                    onClick={() => handleSuggestionClick(recent)}
                    className="w-full px-3 py-2 text-left hover:bg-accent/50 flex items-center space-x-2 group"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{recent}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {filteredPopular.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Popular
                </div>
                {filteredPopular.slice(0, 5).map((popular, index) => (
                  <button
                    key={`popular-${index}`}
                    onClick={() => handleSuggestionClick(popular)}
                    className="w-full px-3 py-2 text-left hover:bg-accent/50 flex items-center space-x-2 group"
                  >
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{popular}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state when no value */}
            {!value && (recentSearches.length > 0 || popularSearches.length > 0) && (
              <div className="p-2">
                {recentSearches.length > 0 && (
                  <div className="mb-2">
                    <div className="px-1 py-1 text-xs font-medium text-muted-foreground">
                      Recent
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recentSearches.slice(0, 3).map((recent, index) => (
                        <Badge
                          key={`recent-badge-${index}`}
                          variant="secondary"
                          className="cursor-pointer hover:bg-accent text-xs"
                          onClick={() => handleSuggestionClick(recent)}
                        >
                          {recent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {popularSearches.length > 0 && (
                  <div>
                    <div className="px-1 py-1 text-xs font-medium text-muted-foreground">
                      Popular
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {popularSearches.slice(0, 3).map((popular, index) => (
                        <Badge
                          key={`popular-badge-${index}`}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent text-xs"
                          onClick={() => handleSuggestionClick(popular)}
                        >
                          {popular}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
