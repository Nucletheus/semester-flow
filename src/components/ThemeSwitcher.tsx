import { Moon, Sun, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Theme, useTheme } from "./ThemeProvider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ThemeSwitcher() {
    const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();

    const themes: { value: Theme; label: string; color: string }[] = [
        { value: "tropical", label: "Tropical", color: "bg-purple-600" },
        { value: "ocean", label: "Ocean", color: "bg-cyan-600" },
        { value: "forest", label: "Forest", color: "bg-emerald-600" },
        { value: "sunset", label: "Sunset", color: "bg-orange-500" },
        { value: "nebula", label: "Nebula", color: "bg-violet-600" },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Palette className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <Label htmlFor="dark-mode" className="text-sm font-medium">Dark Mode</Label>
                    </div>
                    <Switch
                        id="dark-mode"
                        checked={isDarkMode}
                        onCheckedChange={toggleDarkMode}
                    />
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Select Theme</DropdownMenuLabel>

                {themes.map((t) => (
                    <DropdownMenuItem
                        key={t.value}
                        onClick={() => setTheme(t.value)}
                        className="justify-between cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${t.color}`} />
                            {t.label}
                        </div>
                        {theme === t.value && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
