import { useState } from 'react';
import { Search, Brain, User, Camera, MapPin, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AISearchBarProps {
  onSearch: (query: string, filter?: string) => void;
  isAIReady?: boolean;
}

export function AISearchBar({ onSearch, isAIReady = false }: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'object', label: 'Objects', icon: Camera },
    { id: 'face', label: 'Faces', icon: User },
    { id: 'scene', label: 'Places', icon: MapPin },
  ];

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query, activeFilter);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-app-surface border-b border-app-border">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isAIReady ? "Search with AI: 'beach', 'sunset', 'people', 'dog'..." : "Loading AI models..."}
            disabled={!isAIReady}
            className="pl-10 bg-app-bg border-app-border focus:border-app-accent"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={!isAIReady || !query.trim()}
          className="bg-app-accent hover:bg-app-accent-hover min-w-[120px]"
        >
          <Brain className="w-4 h-4 mr-2" />
          {isAIReady ? 'AI Search' : 'Loading...'}
        </Button>
      </div>

      {/* Filter Badges */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <Badge
              key={filter.id}
              variant={isActive ? 'default' : 'outline'}
              className={
                `cursor-pointer transition-all duration-200 
                ${isActive 
                  ? 'bg-app-accent text-white hover:bg-app-accent-hover' 
                  : 'hover:bg-app-accent/20 hover:border-app-accent'
                }
                ${!isAIReady && 'opacity-50 cursor-not-allowed'}`
              }
              onClick={() => isAIReady && setActiveFilter(filter.id)}
            >
              <Icon className="w-3 h-3 mr-1" />
              {filter.label}
            </Badge>
          );
        })}
      </div>

      {/* AI Status Indicator */}
      {!isAIReady && (
        <div className="text-xs text-app-muted flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-app-accent" />
          Loading AI models... This may take a moment.
        </div>
      )}

      {/* Search Hints */}
      {isAIReady && !query && (
        <div className="text-xs text-app-muted">
          🧠 Try searching for: <span className="text-app-text">"beach"</span>, 
          <span className="text-app-text"> "sunset"</span>, 
          <span className="text-app-text"> "people"</span>, 
          <span className="text-app-text"> "dog"</span>, or any object/scene
        </div>
      )}
    </div>
  );
}
