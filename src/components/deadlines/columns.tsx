import { ColumnDef } from "@tanstack/react-table"
import { Assignment } from "@/hooks/useAssignments"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { CellClass } from "./cells/CellClass"
import { CellDeadline } from "./cells/CellDeadline"
import { CellStatus } from "./cells/CellStatus"
import { CellDueDate } from "./cells/CellDueDate"

// Extended type for UI purposes
export type AssignmentUI = Omit<Assignment, "status"> & {
    status?: string;
}

export interface TableMeta {
    updateData: (id: string, field: keyof AssignmentUI, value: any) => void;
    deleteData: (id: string) => void;
    classOptions: { label: string, color: string }[];
    onCreateRow: () => void;
    isCompact: boolean;
    semesterStart?: Date;
    semesterEnd?: Date;
}

export const columns: ColumnDef<AssignmentUI>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? "indeterminate" : false)}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "class_name",
        header: ({ column, table }) => {
            const isCompact = (table.options.meta as TableMeta)?.isCompact
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={cn("px-0 hover:bg-transparent", isCompact && "text-xs h-7")}
                >
                    Category
                    <ArrowUpDown className={cn("ml-2 h-4 w-4", isCompact && "h-3 w-3")} />
                </Button>
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            const isCompact = meta?.isCompact
            return (
                <CellClass
                    initialValue={row.getValue("class_name") as string}
                    onUpdate={(val, color) => {
                        meta?.updateData(row.original.id, "class_name", val)
                        if (color) {
                            meta?.updateData(row.original.id, "color", color)
                        }
                    }}
                    options={meta?.classOptions}
                    isCompact={isCompact}
                />
            )
        }
    },
    {
        accessorKey: "assignment_name",
        header: ({ column, table }) => {
            const isCompact = (table.options.meta as TableMeta)?.isCompact
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={cn("px-0 hover:bg-transparent", isCompact && "text-xs h-7")}
                >
                    Deadline
                    <ArrowUpDown className={cn("ml-2 h-4 w-4", isCompact && "h-3 w-3")} />
                </Button>
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            const isCompact = meta?.isCompact
            return (
                <CellDeadline
                    initialValue={row.getValue("assignment_name") as string}
                    onUpdate={(val) => meta?.updateData(row.original.id, "assignment_name", val)}
                    isCompact={isCompact}
                />
            )
        }
    },
    {
        accessorKey: "status",
        header: ({ column, table }) => {
            const isCompact = (table.options.meta as TableMeta)?.isCompact
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={cn("px-0 hover:bg-transparent", isCompact && "text-xs h-7")}
                >
                    Status
                    <ArrowUpDown className={cn("ml-2 h-4 w-4", isCompact && "h-3 w-3")} />
                </Button>
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            const isCompact = meta?.isCompact
            return (
                <CellStatus
                    initialValue={row.getValue("status") as string}
                    onUpdate={(val) => meta?.updateData(row.original.id, "status", val)}
                    isCompact={isCompact}
                />
            )
        },
    },
    {
        accessorKey: "due_date",
        header: ({ column, table }) => {
            const isCompact = (table.options.meta as TableMeta)?.isCompact
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className={cn("px-0 hover:bg-transparent", isCompact && "text-xs h-7")}
                >
                    Due Date
                    <ArrowUpDown className={cn("ml-2 h-4 w-4", isCompact && "h-3 w-3")} />
                </Button>
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            const isCompact = meta?.isCompact
            return (
                <CellDueDate
                    initialValue={row.getValue("due_date") as string}
                    onUpdate={(val) => meta?.updateData(row.original.id, "due_date", val.toISOString())}
                    onEnter={() => meta?.onCreateRow()}
                    isCompact={isCompact}
                    minDate={meta?.semesterStart}
                    maxDate={meta?.semesterEnd}
                />
            )
        }
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            const isCompact = meta?.isCompact
            return (
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "text-muted-foreground hover:text-destructive",
                        isCompact ? "h-6 w-6" : "h-8 w-8"
                    )}
                    onClick={() => meta?.deleteData(row.original.id)}
                >
                    <Trash2 className={cn("h-4 w-4", isCompact && "h-3.5 w-3.5")} />
                </Button>
            )
        }
    }
]
