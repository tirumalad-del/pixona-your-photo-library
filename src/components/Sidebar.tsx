import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { 
  Images, 
  Users, 
  FolderOpen, 
  MapPin, 
  Copy, 
  Settings,
  Calendar,
    Video,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportDialog } from "@/components/ImportDialog";
import { SunflowerLoader, SunflowerIcon } from "@/components/SunflowerLoader";

const navItems = [
  { title: "Library", url: "/", icon: Images },
  { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Videos", url: "/videos", icon: Video },
  { title: "People", url: "/people", icon: Users },
  { title: "Albums", url: "/albums", icon: FolderOpen },
  { title: "Places", url: "/places", icon: MapPin },
  { title: "Duplicates", url: "/duplicates", icon: Copy },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <>
      <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <SunflowerLoader size={32} />
            <div>
              <h1 className="text-2xl font-bold text-sidebar-primary">PIXONA</h1>
              <p className="text-xs text-sidebar-foreground/60">Photo Manager</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <Button 
            className="w-full bg-app-accent hover:bg-app-accent-hover"
            onClick={() => setImportDialogOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Import Photos
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Photos</span>
              <span>12,847</span>
            </div>
            <div className="flex justify-between">
              <span>Videos</span>
              <span>1,203</span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span>64.2 GB</span>
            </div>
          </div>
        </div>
      </aside>

      <ImportDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen}
      />
    </>
  );
}
