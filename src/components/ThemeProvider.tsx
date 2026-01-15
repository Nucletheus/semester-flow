import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "tropical" | "ocean" | "forest" | "sunset" | "nebula";

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    defaultDark?: boolean;
}

interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const initialState: ThemeProviderState = {
    theme: "tropical",
    setTheme: () => null,
    isDarkMode: false,
    toggleDarkMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "tropical",
    defaultDark = false,
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem("app-theme") as Theme;
            return savedTheme || defaultTheme;
        }
        return defaultTheme;
    });

    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const savedDark = localStorage.getItem("app-dark-mode");
            return savedDark ? savedDark === "true" : defaultDark;
        }
        return defaultDark;
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove all previous theme classes
        root.classList.remove("theme-tropical", "theme-ocean", "theme-forest", "theme-sunset", "theme-nebula");

        // Add current theme class
        root.classList.add(`theme-${theme}`);

        // Handle Dark Mode
        if (isDarkMode) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        // Persist
        localStorage.setItem("app-theme", theme);
        localStorage.setItem("app-dark-mode", String(isDarkMode));
    }, [theme, isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    const value = {
        theme,
        setTheme,
        isDarkMode,
        toggleDarkMode,
    };

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};
