// src/components/Pagination/PaginationFooter.tsx
import React from "react";

interface Props {
  page: number;
  maxPage: number;
  perPage: number;
  setPage: (val: number) => void;
  setPerPage: (val: number) => void;
}

const PaginationFooter = ({ page, maxPage, perPage, setPage, setPerPage }: Props) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-2 mt-4 text-sm dark:text-white">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="border rounded px-2 py-1 dark:bg-brand-dark dark:border-gray-600"
        >
          {[5, 10, 15, 20].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-slate-300 dark:bg-slate-700 disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} of {maxPage}
        </span>
        <button
          onClick={() => setPage(Math.min(maxPage, page + 1))}
          disabled={page === maxPage}
          className="px-3 py-1 rounded bg-slate-300 dark:bg-slate-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationFooter;
