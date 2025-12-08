import { Button } from "@/components/ui/button";
import { Grid3x3, List, Calendar } from "lucide-react";

interface ViewHeaderProps {
  title: string;
  subtitle?: string;
  viewMode?: "grid" | "list" | "timeline";
  onViewModeChange?: (mode: "grid" | "list" | "timeline") => void;
}

export function ViewHeader({ 
  title, 
  subtitle,
  viewMode = "grid",
  onViewModeChange 
}: ViewHeaderProps) {
  return (
    <div className="h-16 bg-app-surface border-b border-app-border px-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-app-text">{title}</h2>
        {subtitle && (
          <p className="text-sm text-app-text-muted">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={viewMode === "grid" ? "bg-app-hover" : ""}
          onClick={() => onViewModeChange?.("grid")}
        >
          <Grid3x3 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={viewMode === "list" ? "bg-app-hover" : ""}
          onClick={() => onViewModeChange?.("list")}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={viewMode === "timeline" ? "bg-app-hover" : ""}
          onClick={() => onViewModeChange?.("timeline")}
        >
          <Calendar className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
