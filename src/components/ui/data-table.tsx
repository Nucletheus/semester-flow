import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  OnChangeFn,
  VisibilityState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMemo, useState } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: any
  rowSelection?: RowSelectionState
  setRowSelection?: React.Dispatch<React.SetStateAction<RowSelectionState>>
  sorting?: SortingState
  setSorting?: OnChangeFn<SortingState>
  getRowId?: (originalRow: TData, index: number, parent?: any) => string
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  isCompact?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  rowSelection,
  setRowSelection,
  sorting: controlledSorting,
  setSorting: setControlledSorting,
  columnVisibility,
  onColumnVisibilityChange,
  getRowId,
  isCompact = false,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])

  const sorting = controlledSorting ?? internalSorting
  const setSorting = setControlledSorting ?? setInternalSorting

  const rowAppearanceByOriginal = useMemo(() => {
    const map = new WeakMap<object, { isCompleted: boolean; style: React.CSSProperties }>()
    data.forEach((row) => {
      if (!row || typeof row !== "object") return
      const typedRow = row as any
      const status = typedRow.status
      const isCompleted = status === "completed"
      const color = typedRow.color
      const usesThemeVar = typeof color === "string" && color.startsWith("var(")

      map.set(row as object, {
        isCompleted,
        style: {
          backgroundColor: usesThemeVar
            ? `hsl(${color} / 0.1)`
            : color ? `${color}33` : undefined,
          borderLeft: usesThemeVar
            ? `${isCompact ? "3px" : "4px"} solid hsl(${color})`
            : color ? `${isCompact ? "3px" : "4px"} solid ${color}` : undefined,
          textDecoration: isCompleted ? "line-through" : undefined,
        },
      })
    })
    return map
  }, [data, isCompact])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange,
    getRowId,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
    meta: {
      ...meta,
      isCompact,
    },
  })

  return (
    <div className="rounded-md border max-w-full overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className={isCompact ? "h-8 py-0" : undefined}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const rowAppearance = rowAppearanceByOriginal.get(row.original as object)
              const isCompleted = rowAppearance?.isCompleted ?? false

              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={isCompleted ? "opacity-60" : undefined}
                  style={rowAppearance?.style}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={isCompact ? "py-0.5 px-1.5 h-7" : "py-1 px-2 h-8"}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
