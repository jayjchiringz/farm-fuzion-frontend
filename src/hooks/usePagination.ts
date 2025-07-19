// src/hooks/usePagination.ts
import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], defaultPerPage = 5) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  const maxPage = Math.ceil(items.length / perPage);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page, perPage]);

  return {
    page,
    perPage,
    setPage,
    setPerPage,
    maxPage,
    paginatedItems,
  };
}
