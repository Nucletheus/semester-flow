import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 flex h-16 items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-6 w-px bg-border/50 hidden md:block" />

          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold leading-none">Workload Tracker</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Capacity Planner</p>
            </div>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Header Actions Portal Target */}
          <div id="header-actions" className="flex items-center gap-2" />
        </div>
      </div>
    </header>
  );
}
