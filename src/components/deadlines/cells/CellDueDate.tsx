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
}

export function CellDueDate({ initialValue, onUpdate, onEnter }: CellDueDateProps) {
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
                        "w-full justify-start text-left font-normal h-8 px-2 hover:bg-muted/50",
                        !date && "text-muted-foreground"
                    )}
                    onKeyDown={handleKeyDown}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
