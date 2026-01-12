import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface CellDeadlineProps {
    initialValue: string
    onUpdate: (value: string) => void
}

export function CellDeadline({ initialValue, onUpdate }: CellDeadlineProps) {
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
            className="border-none shadow-none focus-visible:ring-1 bg-transparent hover:bg-muted/50 p-2 h-8"
        />
    )
}
