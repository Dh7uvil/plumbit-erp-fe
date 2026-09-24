import { navigation } from "@/config/navigation";
import { reportCatalog } from "@/config/report-catalog";

const KNOWN_APP_HREFS = new Set<string>([
  ...navigation.flatMap((g) => g.items.map((i) => i.href)),
  ...reportCatalog.flatMap((g) => g.items.map((i) => i.href)),
  "/purchase-orders",
  "/purchase-invoices",
  "/settings/profile",
  "/settings/password",
  "/settings/notifications",
]);

export function isKnownAppHref(href: string): boolean {
  return KNOWN_APP_HREFS.has(href);
}
