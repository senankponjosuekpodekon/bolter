import { ReactNode, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";

type ColumnKey<T extends Record<string, unknown>> = Extract<keyof T, string>;

interface TableColumn<T extends Record<string, unknown>> {
  key: ColumnKey<T>;
  label: string;
  render?: (value: T[ColumnKey<T>], row: T) => ReactNode;
  sortable?: boolean;
}

interface FilteredResultsProps<T extends Record<string, unknown>> {
  data: T[];
  total: number;
  columns: Array<TableColumn<T>>;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  enableSelection?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  idField?: ColumnKey<T>;
}

/**
 * FilteredResults component - Displays filtered results in table with pagination and optional selection
 */
export function FilteredResults<T extends Record<string, unknown>>({
  data,
  total,
  columns,
  currentPage,
  pageSize,
  onPageChange,
  onSelectionChange,
  enableSelection = false,
  loading = false,
  error,
  emptyMessage = "No results found",
  idField = "id" as ColumnKey<T>,
}: FilteredResultsProps<T>) {
  const totalPages = Math.ceil(total / pageSize);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(
        data.map((row) => String(row[idField] ?? ""))
      );
      setSelectedIds(newSelected);
      onSelectionChange?.(Array.from(newSelected));
    }
  }, [data, selectedIds, idField, onSelectionChange]);

  const handleSelectRow = useCallback(
    (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
      onSelectionChange?.(Array.from(newSelected));
    },
    [selectedIds, onSelectionChange]
  );

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Results Info */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, total)} of {total} results
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              {enableSelection && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === data.length && data.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-gray-100 dark:border-gray-700 transition ${
                  enableSelection && selectedIds.has(String(row[idField] ?? ""))
                    ? "bg-blue-50 dark:bg-blue-900"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {enableSelection && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(String(row[idField] ?? ""))}
                      onChange={() =>
                        handleSelectRow(String(row[idField] ?? ""))
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg font-medium transition ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default FilteredResults;
