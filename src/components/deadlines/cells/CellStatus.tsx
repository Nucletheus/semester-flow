import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { memo } from "react"

interface CellStatusProps {
    initialValue: string
    onUpdate: (value: string) => void
    isCompact?: boolean;
}

function CellStatusBase({ initialValue, onUpdate, isCompact = false }: CellStatusProps) {
    const validValues = ["not started", "in progress", "completed"]
    const displayValue = validValues.includes(initialValue) ? initialValue : "not started"

    const getBadgeStyle = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-500 hover:bg-green-600 text-white border-transparent"
            case "in progress":
                return "bg-blue-500 hover:bg-blue-600 text-white border-transparent"
            case "not started":
            default:
                return "bg-slate-500 hover:bg-slate-600 text-white border-transparent"
        }
    }

    return (
        <Select value={displayValue} onValueChange={onUpdate}>
            <SelectTrigger className={cn(
                "border-none shadow-none bg-transparent hover:bg-muted/50 px-2 focus:ring-0 transition-all",
                isCompact ? "w-[130px] h-7" : "w-[180px] h-8"
            )}>
                <SelectValue>
                    <Badge className={cn(
                        "rounded-md font-normal w-full justify-center transition-all",
                        getBadgeStyle(displayValue),
                        isCompact ? "text-[10px] h-5 py-0 px-1" : "text-xs"
                    )}>
                        {displayValue}
                    </Badge>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="not started">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        Not Started
                    </span>
                </SelectItem>
                <SelectItem value="in progress">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        In Progress
                    </span>
                </SelectItem>
                <SelectItem value="completed">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Completed
                    </span>
                </SelectItem>
            </SelectContent>
        </Select>
    )
}

export const CellStatus = memo(CellStatusBase)
