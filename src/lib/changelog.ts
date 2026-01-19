// Changelog data for What's New popup
// Update CURRENT_VERSION and add new entries to CHANGELOG when deploying updates

export const CURRENT_VERSION = "1.2.0";

export interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    highlights: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.2.0",
        date: "2026-01-19",
        title: "Chart Category Visibility",
        highlights: [
            "Click categories in the chart legend to hide/show them",
            "Hidden category preferences sync across all your devices",
            "Visual indicators for hidden categories (strikethrough)",
        ],
    },
    {
        version: "1.1.0",
        date: "2026-01-19",
        title: "UI Improvements & Responsive Fixes",
        highlights: [
            "Fixed category picker scrolling with trackpad",
            "Themed scrollbars that match your selected theme",
            "Improved bulk add screen for mobile devices",
            "More compact category dropdown for smaller screens",
            "Added What's New popup to highlight updates",
        ],
    },
    {
        version: "1.0.0",
        date: "2026-01-15",
        title: "Initial Release",
        highlights: [
            "Dashboard with workload visualization",
            "Deadline tracking with categories",
            "Bulk add assignments feature",
            "Multiple theme options",
            "Dark mode support",
        ],
    },
];

// Helper to get entries newer than a given version
export function getNewEntries(lastSeenVersion: string | null): ChangelogEntry[] {
    if (!lastSeenVersion) {
        // First time user - show only latest version
        return CHANGELOG.slice(0, 1);
    }

    const lastSeenIndex = CHANGELOG.findIndex(e => e.version === lastSeenVersion);

    if (lastSeenIndex === -1) {
        // Version not found - show only latest
        return CHANGELOG.slice(0, 1);
    }

    if (lastSeenIndex === 0) {
        // Already on latest
        return [];
    }

    // Return all entries newer than last seen
    return CHANGELOG.slice(0, lastSeenIndex);
}
