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
import { useState } from "react"

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
              const status = (row.original as any).status;
              const isCompleted = status === "completed";

              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={isCompleted ? "opacity-60" : undefined}
                  style={{
                    backgroundColor: (row.original as any).color?.startsWith('var(')
                      ? `hsl(${(row.original as any).color} / 0.1)`
                      : (row.original as any).color ? `${(row.original as any).color}33` : undefined,
                    borderLeft: (row.original as any).color?.startsWith('var(')
                      ? `${isCompact ? '3px' : '4px'} solid hsl(${(row.original as any).color})`
                      : (row.original as any).color ? `${isCompact ? '3px' : '4px'} solid ${(row.original as any).color}` : undefined,
                    textDecoration: isCompleted ? "line-through" : undefined
                  }}
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
