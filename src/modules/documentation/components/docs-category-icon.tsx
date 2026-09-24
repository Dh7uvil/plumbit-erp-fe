"use client";

import {
  BookOpen,
  Boxes,
  Building2,
  Calculator,
  Globe,
  ListChecks,
  Megaphone,
  Package,
  Rocket,
  Scale,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

const DOCS_CATEGORY_ICONS: Record<string, LucideIcon> = {
  "getting-started": Rocket,
  "organization-and-access": Building2,
  "master-data": Package,
  inventory: Boxes,
  sales: ShoppingCart,
  purchases: ShoppingBag,
  "import-export": Globe,
  accounting: Calculator,
  crm: Megaphone,
  reports: Scale,
  collaboration: Users,
  "planning-and-ai": Sparkles,
  workflows: ListChecks,
};

export function docsCategoryIcon(slug: string): LucideIcon {
  return DOCS_CATEGORY_ICONS[slug] ?? BookOpen;
}

export function DocsCategoryIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Icon = docsCategoryIcon(slug);
  return <Icon className={className} aria-hidden="true" />;
}
