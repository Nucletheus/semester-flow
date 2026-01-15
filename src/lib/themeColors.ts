
// Theme color variables defined in index.css
// We use generic slots so each theme can define its own palette (e.g. Ocean = different blues, Sunset = different reds)
export const THEME_CLASS_VARS = [
    "var(--theme-color-1)",
    "var(--theme-color-2)",
    "var(--theme-color-3)",
    "var(--theme-color-4)",
    "var(--theme-color-5)",
    "var(--theme-color-6)",
    "var(--theme-color-7)",
    "var(--theme-color-8)",
    "var(--theme-color-9)",
    "var(--theme-color-10)",
];

/**
 * Returns the CSS variable NAME string for a class based on its sorted index.
 * Example: "var(--theme-color-1)"
 * This is useful if you need to construct an HSL string with alpha, e.g. `hsl(var(--theme-color-1) / 0.5)`
 */
export function getClassThemeVar(className: string, allClassNames: string[]): string {
    if (!className) return THEME_CLASS_VARS[0];

    // Ensure we have a sorted list for consistent comparison
    const sortedClasses = [...new Set(allClassNames)].sort();
    const index = sortedClasses.indexOf(className);

    if (index === -1) {
        // Fallback if class not found in list (shouldn't happen usually)
        return THEME_CLASS_VARS[0];
    }

    // Rotate through available colors
    return THEME_CLASS_VARS[index % THEME_CLASS_VARS.length];
}

/**
 * Returns the ready-to-use CSS HSL color string.
 * Example: "hsl(var(--theme-color-1))"
 */
export function getClassThemeColor(className: string, allClassNames: string[]): string {
    const colorVar = getClassThemeVar(className, allClassNames);
    return `hsl(${colorVar})`;
}
