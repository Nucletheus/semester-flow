import { ColumnDef } from "@tanstack/react-table"
import { Assignment } from "@/hooks/useAssignments"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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
    lastCreatedId?: string | null;
    onCreateRow: () => void;
}

export const columns: ColumnDef<AssignmentUI>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent"
                >
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
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
                    autoFocus={meta?.lastCreatedId === row.original.id}
                />
            )
        }
    },
    {
        accessorKey: "assignment_name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent"
                >
                    Deadline
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            return (
                <CellDeadline
                    initialValue={row.getValue("assignment_name") as string}
                    onUpdate={(val) => meta?.updateData(row.original.id, "assignment_name", val)}
                />
            )
        }
    },
    {
        accessorKey: "status",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent"
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            return (
                <CellStatus
                    initialValue={row.getValue("status") as string}
                    onUpdate={(val) => meta?.updateData(row.original.id, "status", val)}
                />
            )
        },
    },
    {
        accessorKey: "due_date",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-0 hover:bg-transparent"
                >
                    Due Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            return (
                <CellDueDate
                    initialValue={row.getValue("due_date") as string}
                    onUpdate={(val) => meta?.updateData(row.original.id, "due_date", val.toISOString())}
                    onEnter={() => meta?.onCreateRow()}
                />
            )
        }
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const meta = table.options.meta as TableMeta
            return (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => meta?.deleteData(row.original.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )
        }
    }
]
