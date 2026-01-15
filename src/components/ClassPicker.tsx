
import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

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

    const handleSelect = (option: ClassOption) => {
        onChange(option.value, option.color)
        setOpen(false)
    }

    const handleCreate = () => {
        if (!searchValue) return
        const trimmedValue = searchValue.trim();
        if (!trimmedValue) return;

        // Check if exists case insensitive
        const existing = options.find(o => o.label.toLowerCase() === trimmedValue.toLowerCase())
        if (existing) {
            handleSelect(existing)
        } else {
            const newColor = getRandomColor()
            onChange(trimmedValue, newColor)
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
                >
                    {value ? (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full border shrink-0"
                                style={{ backgroundColor: options.find(o => o.value === value)?.color || getRandomColor() }}
                            />
                            <span className="truncate">{value}</span>
                        </div>
                    ) : (
                        "Select or create category..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search category..." onValueChange={setSearchValue} />
                    <CommandList>
                        <CommandEmpty className="p-2">
                            <div className="text-sm text-muted-foreground mb-2 px-2">No category found.</div>
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create "{searchValue}"
                            </Button>
                        </CommandEmpty>
                        <CommandGroup heading="Existing Categories">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => handleSelect(option)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: option.color }} />
                                        {option.label}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
