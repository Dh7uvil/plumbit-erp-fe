"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { DEFAULT_PAGE_SIZE } from "@/config/constants";

export type SortOrder = "asc" | "desc";

export type TableParams = {
  page: number;
  page_size: number;
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  filters: Record<string, string>;
};

type TableParamPatch = {
  page?: number;
  page_size?: number;
  search?: string | null;
  sort_by?: string | null;
  sort_order?: SortOrder | null;
  filters?: Record<string, string | undefined | null>;
};

const RESERVED = new Set(["page", "page_size", "search", "sort_by", "sort_order"]);

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function useTableParams(): TableParams & {
  setParams: (patch: TableParamPatch) => void;
  setPage: (page: number) => void;
} {
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
      page_size: parsePositiveInt(searchParams.get("page_size"), DEFAULT_PAGE_SIZE),
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

  return { ...params, setParams, setPage };
}
