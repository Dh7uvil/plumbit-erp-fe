"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, type PageSizeOption } from "@/config/constants";

export type SortOrder = "asc" | "desc";

export type TableParams = {
  page: number;
  page_size: number;
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  filters: Record<string, string>;
};

export type TableParamPatch = {
  page?: number;
  page_size?: number;
  search?: string | null;
  sort_by?: string | null;
  sort_order?: SortOrder | null;
  filters?: Record<string, string | undefined | null>;
};

export type TableParamsController = TableParams & {
  setParams: (patch: TableParamPatch) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
};

const RESERVED = new Set(["page", "page_size", "search", "sort_by", "sort_order"]);

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | null): PageSizeOption {
  const parsed = parsePositiveInt(value, DEFAULT_PAGE_SIZE);
  return PAGE_SIZE_OPTIONS.includes(parsed as PageSizeOption)
    ? (parsed as PageSizeOption)
    : DEFAULT_PAGE_SIZE;
}

function applyTableParamPatch(current: TableParams, patch: TableParamPatch): TableParams {
  const resetsPage = patch.page === undefined;
  const next: TableParams = {
    page: current.page,
    page_size: current.page_size,
    search: current.search,
    sort_by: current.sort_by,
    sort_order: current.sort_order,
    filters: { ...current.filters },
  };
  if (patch.search !== undefined) {
    next.search = patch.search || undefined;
  }
  if (patch.sort_by !== undefined) {
    next.sort_by = patch.sort_by || undefined;
  }
  if (patch.sort_order !== undefined) {
    next.sort_order = patch.sort_order ?? undefined;
  }
  if (patch.page_size !== undefined) {
    next.page_size = parsePageSize(String(patch.page_size));
  }
  if (patch.filters) {
    for (const [key, value] of Object.entries(patch.filters)) {
      if (value) {
        next.filters[key] = value;
      } else {
        delete next.filters[key];
      }
    }
  }
  if (patch.page !== undefined) {
    next.page = patch.page > 0 ? patch.page : 1;
  } else if (resetsPage) {
    next.page = 1;
  }
  return next;
}

export function useNestedTableParams(): TableParamsController {
  const [params, setState] = useState<TableParams>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    filters: {},
  });

  const setParams = useCallback((patch: TableParamPatch) => {
    setState((current) => applyTableParamPatch(current, patch));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams({ page });
  }, [setParams]);

  const setPageSize = useCallback(
    (pageSize: number) => {
      setParams({ page_size: pageSize });
    },
    [setParams],
  );

  return { ...params, setParams, setPage, setPageSize };
}

export function useTableParams(): TableParamsController {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = useMemo((): TableParams => {
    const filters: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (!RESERVED.has(key) && value) {
        filters[key] = value;
      }
    }
    const sortOrder = searchParams.get("sort_order");
    return {
      page: parsePositiveInt(searchParams.get("page"), 1),
      page_size: parsePageSize(searchParams.get("page_size")),
      search: searchParams.get("search") || undefined,
      sort_by: searchParams.get("sort_by") || undefined,
      sort_order: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
      filters,
    };
  }, [searchParams]);

  const setParams = useCallback(
    (patch: TableParamPatch) => {
      const next = new URLSearchParams(searchParams.toString());
      const resetsPage = patch.page === undefined;

      if (patch.search !== undefined) {
        if (patch.search) {
          next.set("search", patch.search);
        } else {
          next.delete("search");
        }
      }
      if (patch.sort_by !== undefined) {
        if (patch.sort_by) {
          next.set("sort_by", patch.sort_by);
        } else {
          next.delete("sort_by");
        }
      }
      if (patch.sort_order !== undefined) {
        if (patch.sort_order) {
          next.set("sort_order", patch.sort_order);
        } else {
          next.delete("sort_order");
        }
      }
      if (patch.page_size !== undefined) {
        next.set("page_size", String(patch.page_size));
      }
      if (patch.filters) {
        for (const [key, value] of Object.entries(patch.filters)) {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
      }
      if (patch.page !== undefined) {
        if (patch.page <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(patch.page));
        }
      } else if (resetsPage) {
        next.delete("page");
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      setParams({ page });
    },
    [setParams],
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      setParams({ page_size: pageSize });
    },
    [setParams],
  );

  return { ...params, setParams, setPage, setPageSize };
}
