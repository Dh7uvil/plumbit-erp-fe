import { MAX_PAGE_SIZE } from "@/config/constants";
import type { ListResponse } from "@/shared/api/envelope";

export async function fetchAllPages<T>(
  loadPage: (page: number, pageSize: number) => Promise<ListResponse<T[]>>,
): Promise<T[]> {
  const first = await loadPage(1, MAX_PAGE_SIZE);
  const items = [...first.data];
  const totalPages = Math.max(first.meta.total_pages, 1);
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await loadPage(page, MAX_PAGE_SIZE);
    items.push(...next.data);
  }
  return items;
}
