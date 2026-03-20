import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { PackageOpen } from 'lucide-react'

export interface ColumnDef<T> {
    header: string
    accessorKey?: keyof T
    cell?: (item: T, index: number) => React.ReactNode
    className?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    isLoading?: boolean
    emptyMessage?: string
}

export default function DataTable<T>({
    data,
    columns,
    isLoading = false,
    emptyMessage = 'Belum ada data',
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="rounded-xl border border-brand-border dark:border-dark-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, i) => (
                                <TableHead key={i}>{col.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                {columns.map((_, j) => (
                                    <TableCell key={j}>
                                        <Skeleton className="h-5 w-full" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-brand-border dark:border-dark-border py-16">
                <PackageOpen className="h-12 w-12 text-brand-muted dark:text-dark-muted mb-4" />
                <p className="text-lg font-medium text-brand-text dark:text-dark-text">
                    {emptyMessage}
                </p>
                <p className="text-sm text-brand-muted dark:text-dark-muted mt-1">
                    Data akan tampil di sini setelah ditambahkan.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-brand-border dark:border-dark-border overflow-hidden overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-brand-surface/50 dark:bg-dark-surface/50">
                        {columns.map((col, i) => (
                            <TableHead key={i} className={col.className}>
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, i) => (
                        <TableRow
                            key={i}
                            className="hover:bg-brand-surface/30 dark:hover:bg-dark-surface/30 transition-colors"
                        >
                            {columns.map((col, j) => (
                                <TableCell key={j} className={col.className}>
                                    {col.cell
                                        ? col.cell(item, i)
                                        : col.accessorKey
                                            ? String((item as Record<string, unknown>)[col.accessorKey as string] ?? '')
                                            : ''}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
