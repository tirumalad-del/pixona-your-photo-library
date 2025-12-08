import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { soundManager } from "@/lib/sounds";
import Library from "./pages/Library";
import Calendar from "./pages/Calendar";
import People from "./pages/People";
import Albums from "./pages/Albums";
import Places from "./pages/Places";
import Duplicates from "./pages/Duplicates";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Initialize sound manager on app load
  useEffect(() => {
    soundManager.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <Routes>
              <Route path="/" element={<Library />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/people" element={<People />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/places" element={<Places />} />
              <Route path="/duplicates" element={<Duplicates />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
