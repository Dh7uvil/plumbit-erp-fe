export const DOCS_CATEGORY_ACCENTS: Record<string, { icon: string; badge: string; stripe: string }> = {
  "getting-started": {
    icon: "bg-primary/10 text-primary",
    badge: "bg-primary/10 text-primary",
    stripe: "border-l-primary/70",
  },
  "organization-and-access": {
    icon: "bg-info-muted text-info-foreground",
    badge: "bg-info-muted text-info-foreground",
    stripe: "border-l-sky-500/70",
  },
  "master-data": {
    icon: "bg-secondary text-secondary-foreground",
    badge: "bg-secondary text-secondary-foreground",
    stripe: "border-l-violet-500/70",
  },
  inventory: {
    icon: "bg-success-muted text-success-foreground",
    badge: "bg-success-muted text-success-foreground",
    stripe: "border-l-emerald-500/70",
  },
  sales: {
    icon: "bg-primary/10 text-primary",
    badge: "bg-primary/10 text-primary",
    stripe: "border-l-indigo-500/70",
  },
  purchases: {
    icon: "bg-warning-muted text-warning-foreground",
    badge: "bg-warning-muted text-warning-foreground",
    stripe: "border-l-amber-500/70",
  },
  "import-export": {
    icon: "bg-info-muted text-info-foreground",
    badge: "bg-info-muted text-info-foreground",
    stripe: "border-l-cyan-500/70",
  },
  accounting: {
    icon: "bg-secondary text-secondary-foreground",
    badge: "bg-secondary text-secondary-foreground",
    stripe: "border-l-blue-600/70",
  },
  crm: {
    icon: "bg-primary/10 text-primary",
    badge: "bg-primary/10 text-primary",
    stripe: "border-l-purple-500/70",
  },
  reports: {
    icon: "bg-muted text-foreground",
    badge: "bg-muted text-foreground",
    stripe: "border-l-slate-500/70",
  },
  collaboration: {
    icon: "bg-success-muted text-success-foreground",
    badge: "bg-success-muted text-success-foreground",
    stripe: "border-l-teal-500/70",
  },
  "planning-and-ai": {
    icon: "bg-warning-muted text-warning-foreground",
    badge: "bg-warning-muted text-warning-foreground",
    stripe: "border-l-orange-500/70",
  },
  workflows: {
    icon: "bg-primary/10 text-primary",
    badge: "bg-primary/10 text-primary",
    stripe: "border-l-primary/70",
  },
};

export function docsCategoryAccent(slug: string) {
  return (
    DOCS_CATEGORY_ACCENTS[slug] ?? {
      icon: "bg-muted text-foreground",
      badge: "bg-muted text-muted-foreground",
      stripe: "border-l-border",
    }
  );
}
