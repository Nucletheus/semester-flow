import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface CellDueDateProps {
    initialValue: string | Date
    onUpdate: (date: Date) => void
    onEnter?: () => void;
    isCompact?: boolean;
    minDate?: Date;
    maxDate?: Date;
}

export function CellDueDate({ initialValue, onUpdate, onEnter, isCompact = false, minDate, maxDate }: CellDueDateProps) {
    const [date, setDate] = useState<Date | undefined>(
        initialValue ? new Date(initialValue) : undefined
    )
    const [open, setOpen] = useState(false)

    const handleSelect = (newDate: Date | undefined) => {
        setDate(newDate)
        if (newDate) {
            onUpdate(newDate)
            setOpen(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !open) {
            e.preventDefault();
            onEnter?.();
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant={"ghost"}
                    className={cn(
                        "w-full justify-start text-left font-normal px-2 hover:bg-muted/50 transition-all",
                        !date && "text-muted-foreground",
                        isCompact ? "h-7 text-xs px-1.5" : "h-8 text-sm"
                    )}
                    onKeyDown={handleKeyDown}
                >
                    <CalendarIcon className={cn("mr-2 h-4 w-4 shrink-0", isCompact && "h-3.5 w-3.5 mr-1.5")} />
                    <span className="truncate">
                        {date ? format(date, isCompact ? "MMM d, yy" : "PPP") : <span>Pick a date</span>}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    defaultMonth={date}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
