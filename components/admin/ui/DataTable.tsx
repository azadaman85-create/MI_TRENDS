"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/admin/ui/Button";
import { EmptyState, TableSkeleton } from "@/components/admin/ui/States";
import { listVariants, rowVariants } from "@/lib/admin/motion";

export type Column<T> = {
  id: string;
  header: string;
  /** Cell contents. */
  render: (row: T) => ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  width?: string;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: (row: T) => string;
  toolbar?: ReactNode;
  selectable?: boolean;
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  rowActions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  initialSort?: { column: string; direction: "asc" | "desc" };
};

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  loading = false,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Search…",
  searchValue,
  toolbar,
  selectable = false,
  bulkActions,
  rowActions,
  onRowClick,
  emptyTitle = "Nothing here yet",
  emptyMessage = "Once records exist they will show up in this table.",
  emptyActionLabel,
  onEmptyAction,
  initialSort,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort ?? null);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!query.trim() || !searchValue) return rows;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((row) => {
      const haystack = searchValue(row).toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [rows, query, searchValue]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((item) => item.id === sort.column);
    if (!column?.sortValue) return filtered;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
      return String(left).localeCompare(String(right)) * factor;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (columnId: string) => {
    setPage(1);
    setSort((current) => {
      if (current?.column !== columnId) return { column: columnId, direction: "asc" };
      if (current.direction === "asc") return { column: columnId, direction: "desc" };
      return null;
    });
  };

  const pageIds = pageRows.map(getRowId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const clearSelection = () => setSelected([]);

  const visiblePages = useMemo(() => {
    const pages: (number | "gap")[] = [];
    for (let index = 1; index <= pageCount; index += 1) {
      if (index === 1 || index === pageCount || Math.abs(index - currentPage) <= 1) pages.push(index);
      else if (pages[pages.length - 1] !== "gap") pages.push("gap");
    }
    return pages;
  }, [pageCount, currentPage]);

  return (
    <div>
      {searchable || toolbar ? (
        <div className="a-toolbar">
          {searchable ? (
            <div className="a-input-icon a-toolbar__search">
              <Search size={15} aria-hidden="true" />
              <input
                className="a-input"
                type="search"
                value={query}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              {query ? (
                <button
                  className="a-input-icon__trailing"
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : null}
          {toolbar}
        </div>
      ) : null}

      <AnimatePresence>
        {selectable && selected.length > 0 ? (
          <motion.div
            className="a-bulkbar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <strong>{selected.length} selected</strong>
            <span className="a-toolbar__spacer" />
            {bulkActions?.(selected, clearSelection)}
            <Button variant="ghost" size="sm" onClick={clearSelection} style={{ color: "#fff" }}>
              Clear
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {loading ? (
        <TableSkeleton rows={Math.min(pageSize, 6)} columns={Math.min(columns.length, 5)} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={query ? "No matches" : emptyTitle}
          message={
            query
              ? `Nothing matched “${query}”. Try a different spelling or clear the search.`
              : emptyMessage
          }
          actionLabel={query ? "Clear search" : emptyActionLabel}
          onAction={query ? () => setQuery("") : onEmptyAction}
        />
      ) : (
        <div className="a-table-wrap">
          <table className="a-table a-table--cards">
            <thead>
              <tr>
                {selectable ? (
                  <th className="a-table__check">
                    <input
                      className="a-checkbox"
                      type="checkbox"
                      checked={allOnPageSelected}
                      aria-label="Select all rows on this page"
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? Array.from(new Set([...current, ...pageIds]))
                            : current.filter((id) => !pageIds.includes(id)),
                        )
                      }
                    />
                  </th>
                ) : null}
                {columns.map((column) => (
                  <th
                    key={column.id}
                    style={{ width: column.width, textAlign: column.align === "right" ? "right" : undefined }}
                  >
                    {column.sortValue ? (
                      <button type="button" onClick={() => toggleSort(column.id)}>
                        {column.header}
                        {sort?.column === column.id ? (
                          sort.direction === "asc" ? (
                            <ArrowUp size={12} aria-hidden="true" />
                          ) : (
                            <ArrowDown size={12} aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown size={12} aria-hidden="true" style={{ opacity: 0.45 }} />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
                {rowActions ? <th className="a-table__actions" aria-label="Row actions" /> : null}
              </tr>
            </thead>
            <motion.tbody variants={listVariants} initial="hidden" animate="visible" key={`${currentPage}-${query}`}>
              {pageRows.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.includes(id);
                return (
                  <motion.tr
                    key={id}
                    variants={rowVariants}
                    className={isSelected ? "is-selected" : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    style={onRowClick ? { cursor: "pointer" } : undefined}
                  >
                    {selectable ? (
                      <td className="a-table__check" onClick={(event) => event.stopPropagation()}>
                        <input
                          className="a-checkbox"
                          type="checkbox"
                          checked={isSelected}
                          aria-label={`Select row ${id}`}
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked
                                ? [...current, id]
                                : current.filter((entry) => entry !== id),
                            )
                          }
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        data-label={column.header}
                        className={column.align === "right" ? "a-table__num" : undefined}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="a-table__actions" data-label="Actions" onClick={(event) => event.stopPropagation()}>
                        <div className="a-row-actions">{rowActions(row)}</div>
                      </td>
                    ) : null}
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      )}

      {!loading && sorted.length > 0 ? (
        <div className="a-pagination">
          <span className="a-micro">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="a-pagination__pages">
            <button
              className="a-page-button"
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            {visiblePages.map((entry, index) =>
              entry === "gap" ? (
                <span key={`gap-${index}`} className="a-page-button" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  className={`a-page-button ${entry === currentPage ? "is-active" : ""}`.trim()}
                  onClick={() => setPage(entry)}
                  aria-label={`Page ${entry}`}
                  aria-current={entry === currentPage ? "page" : undefined}
                >
                  {entry}
                </button>
              ),
            )}
            <button
              className="a-page-button"
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
