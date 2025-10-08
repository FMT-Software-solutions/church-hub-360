import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, Receipt } from 'lucide-react';

// Helper functions for formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount);
};

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

export interface TableAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (record: any) => void;
  variant?: 'default' | 'destructive';
}

interface FinanceDataTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
}

export const FinanceDataTable: React.FC<FinanceDataTableProps> = ({
  data,
  columns,
  actions = [],
  loading = false,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'No records found',
}) => {
  const handleSort = (key: string) => {
    if (!onSort) return;

    const newDirection =
      sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const renderCellValue = (column: TableColumn, record: any) => {
    const value = record[column.key];

    if (column.render) {
      return column.render(value, record);
    }

    // Default rendering based on column key patterns
    if (column.key.includes('amount') || column.key.includes('_amount')) {
      return formatCurrency(value || 0);
    }

    if (column.key.includes('date') || column.key.includes('_date')) {
      return formatDate(value);
    }

    if (column.key === 'status') {
      return (
        <Badge
          variant={
            value === 'active' || value === 'fulfilled'
              ? 'default'
              : value === 'pending'
              ? 'secondary'
              : value === 'overdue' || value === 'cancelled'
              ? 'destructive'
              : 'outline'
          }
        >
          {value}
        </Badge>
      );
    }

    return value || '-';
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-[50px]"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell>
                    <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={
                  column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                }
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && sortKey === column.key && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
            {actions.length > 0 && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                className="text-center py-8 text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((record, index) => (
              <TableRow key={record.id || index}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {renderCellValue(column, record)}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action) => (
                          <DropdownMenuItem
                            key={action.key}
                            onClick={() => action.onClick(record)}
                            className={
                              action.variant === 'destructive'
                                ? 'text-destructive'
                                : ''
                            }
                          >
                            {action.icon}
                            <span className="ml-2">{action.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// Common action configurations
export const commonFinanceActions: TableAction[] = [
  {
    key: 'view',
    label: 'View Details',
    icon: <Eye className="h-4 w-4" />,
    onClick: () => {},
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick: () => {},
  },
  {
    key: 'receipt',
    label: 'Generate Receipt',
    icon: <Receipt className="h-4 w-4" />,
    onClick: () => {},
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: () => {},
    variant: 'destructive' as const,
  },
];
