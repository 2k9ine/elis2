import { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import Button from './Button';
import Skeleton, { SkeletonTable } from './Skeleton';

function Table({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  sortable = false,
  onSort,
  sortColumn,
  sortDirection,
  className,
  rowClassName,
  onRowClick
}) {
  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;

    const newDirection = sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort?.(column.key, newDirection);
  };

  const renderSortIcon = (column) => {
    if (!sortable || !column.sortable) return null;

    if (sortColumn !== column.key) {
      return <ChevronsUpDown className="w-4 h-4 text-text-muted" />;
    }

    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-brand-400" />
      : <ChevronDown className="w-4 h-4 text-brand-400" />;
  };

  if (loading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <SkeletonTable rows={5} columns={columns.length} />
      </div>
    );
  }

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider',
                    sortable && column.sortable && 'cursor-pointer hover:text-text-primary'
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column.title}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={cn(
                    'hover:bg-white/5 transition-colors',
                    onRowClick && 'cursor-pointer',
                    rowClassName
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key] || '-'
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="text-sm text-text-muted">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-sm text-text-muted px-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export { Table, Pagination };
export default Table;
