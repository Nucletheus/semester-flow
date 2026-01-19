import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

import { cn } from "@/lib/utils"

interface CellDeadlineProps {
    initialValue: string
    onUpdate: (value: string) => void
    isCompact?: boolean
}

export function CellDeadline({ initialValue, onUpdate, isCompact = false }: CellDeadlineProps) {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    const onBlur = () => {
        if (value !== initialValue) {
            onUpdate(value)
        }
    }

    return (
        <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
            className={cn(
                "border-none shadow-none focus-visible:ring-1 bg-transparent hover:bg-muted/50 transition-all",
                isCompact ? "p-1.5 h-7 text-xs" : "p-2 h-8 text-sm"
            )}
        />
    )
}
