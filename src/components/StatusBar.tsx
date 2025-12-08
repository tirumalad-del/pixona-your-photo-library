interface StatusBarProps {
  itemCount?: number;
  selectedCount?: number;
  viewMode?: string;
  actions?: React.ReactNode;
}

export function StatusBar({ 
  itemCount = 0, 
  selectedCount = 0, 
  viewMode = "Grid",
  actions
}: StatusBarProps) {
  return (
    <div className="h-8 bg-app-surface border-t border-app-border px-4 flex items-center justify-between text-xs text-app-text-muted">
      <div className="flex items-center gap-4">
        {selectedCount > 0 ? (
          <span>{selectedCount} selected</span>
        ) : (
          <span>{itemCount.toLocaleString()} items</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {actions}
        <span>{viewMode} View</span>
      </div>
    </div>
  );
}
