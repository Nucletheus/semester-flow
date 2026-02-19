import * as React from "react"
import { Check, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface ClassOption {
    value: string
    label: string
    color: string
}

interface ClassPickerProps {
    value: string
    onChange: (value: string, color?: string) => void
    options: ClassOption[]
    className?: string
}

// Theme-aware palette using CSS variables
const THEME_COLORS = [
    "hsl(var(--class-sage))",
    "hsl(var(--class-coral))",
    "hsl(var(--class-sky))",
    "hsl(var(--class-lavender))",
    "hsl(var(--class-amber))",
    "hsl(var(--class-rose))",
    "hsl(var(--class-teal))",
    "hsl(var(--class-indigo))",
];

const getRandomColor = () => THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];

export function ClassPicker({ value, onChange, options, className }: ClassPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const normalizedSearchValue = searchValue.toLowerCase();
    const filteredOptions = React.useMemo(
        () =>
            options.filter((option) =>
                option.label.toLowerCase().includes(normalizedSearchValue)
            ),
        [options, normalizedSearchValue]
    )
    const selectedOption = React.useMemo(
        () => options.find((option) => option.value === value),
        [options, value]
    );

    const handleSelect = (option: ClassOption) => {
        onChange(option.value, option.color)
        setSearchValue("")
        setOpen(false)
    }

    const handleCreate = () => {
        const trimmedValue = searchValue.trim();
        if (!trimmedValue) return;

        const existing = options.find(o => o.label.toLowerCase() === trimmedValue.toLowerCase())
        if (existing) {
            handleSelect(existing)
        } else {
            const newColor = getRandomColor()
            onChange(trimmedValue, newColor)
            setSearchValue("")
            setOpen(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            if (filteredOptions.length > 0) {
                handleSelect(filteredOptions[0])
            } else if (searchValue.trim()) {
                handleCreate()
            }
        }
        if (e.key === "Escape") {
            setOpen(false)
        }
    }

    // Close when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearchValue("")
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open])

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="w-full justify-between font-normal"
            >
                {value ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full border shrink-0"
                            style={{ backgroundColor: selectedOption?.color || getRandomColor() }}
                        />
                        <span className="truncate">{value}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">Select or create category...</span>
                )}
                <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
            </Button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search or create category..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                    <div
                        className="max-h-32 overflow-y-auto"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        {filteredOptions.length > 0 && (
                            <div className="p-1">
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    Existing Categories
                                </div>
                                {filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                                    >
                                        <Check
                                            className={cn(
                                                "h-4 w-4 shrink-0",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div
                                            className="w-3 h-3 rounded-full border shrink-0"
                                            style={{ backgroundColor: option.color }}
                                        />
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {filteredOptions.length === 0 && searchValue.trim() && (
                            <div className="p-2">
                                <div className="text-sm text-muted-foreground mb-2 px-2">No category found.</div>
                                <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={handleCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create "{searchValue.trim()}"
                                </Button>
                            </div>
                        )}
                        {filteredOptions.length === 0 && !searchValue.trim() && options.length === 0 && (
                            <div className="p-4 text-sm text-muted-foreground text-center">
                                Type to create a new category
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
