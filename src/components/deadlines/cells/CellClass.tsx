import { useState, useEffect } from "react"
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

interface ClassOption {
    label: string;
    color: string;
}

interface CellClassProps {
    initialValue: string
    onUpdate: (value: string, color?: string) => void
    options?: ClassOption[]
    autoFocus?: boolean;
    isCompact?: boolean;
}

export function CellClass({ initialValue, onUpdate, options = [], autoFocus = false, isCompact = false }: CellClassProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    // Auto-focus logic
    useEffect(() => {
        if (autoFocus) {
            setOpen(true);
        }
    }, [autoFocus]);

    // Deduplicate options based on label just in case
    const uniqueOptions = Array.from(new Map(options.map(item => [item.label, item])).values());

    const handleSelect = (option: ClassOption) => {
        onUpdate(option.label, option.color)
        setOpen(false)
    }

    const handleCreate = () => {
        if (!searchValue) return;
        const trimmedValue = searchValue.trim();
        if (!trimmedValue) return;

        // Check if it already exists (case insensitive)
        const existing = uniqueOptions.find(o => o.label.toLowerCase() === trimmedValue.toLowerCase());
        if (existing) {
            handleSelect(existing);
        } else {
            // Create new
            onUpdate(trimmedValue, "#000000");
            setOpen(false);
        }
    }

    // Handle keys in input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Check for exact match or create
            const trimmed = searchValue.trim();
            const exactMatch = uniqueOptions.find(o => o.label.toLowerCase() === trimmed.toLowerCase());
            if (exactMatch) {
                handleSelect(exactMatch);
            } else {
                handleCreate();
            }
        }

        if (e.key === 'Tab') {
            if (open) {
                // If there's a search value, try to match
                if (searchValue) {
                    const trimmed = searchValue.trim();
                    const match = uniqueOptions.find(o => o.label.toLowerCase().includes(trimmed.toLowerCase()));
                    if (match) {
                        onUpdate(match.label, match.color);
                        setOpen(false);
                        // NO preventDefault ensures focus moves to the next focusable element (Deadline)
                        return;
                    }
                }
                // If no search value or no match, and we are just Tabbing out?
                setOpen(false);
            }
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal hover:bg-muted/50 truncate px-2",
                        isCompact ? "h-7 text-xs" : "h-8"
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        {initialValue && (
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: options.find(o => o.label === initialValue)?.color || "transparent" }}
                            />
                        )}
                        <span className="truncate">{initialValue || "Select class..."}</span>
                    </div>
                    <ChevronsUpDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50", isCompact && "h-3 w-3")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search category..."
                        onValueChange={setSearchValue}
                        value={searchValue}
                        onKeyDown={handleKeyDown}
                    />
                    <CommandList>
                        <CommandEmpty className="py-2 px-2">
                            <div className="text-sm text-muted-foreground mb-2">No category found.</div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-xs"
                                onClick={handleCreate}
                            >
                                <Plus className="mr-2 h-3 w-3" />
                                Create "{searchValue}"
                            </Button>
                        </CommandEmpty>
                        <CommandGroup heading="Categories">
                            {uniqueOptions.map((option) => (
                                <CommandItem
                                    key={option.label}
                                    value={option.label}
                                    onSelect={() => handleSelect(option)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            initialValue === option.label ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full border"
                                            style={{ backgroundColor: option.color }}
                                        />
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
