import { DocsMobileNav } from "@/modules/documentation/components/docs-mobile-nav";
import { DocsSidebar } from "@/modules/documentation/components/docs-sidebar";

export function DocsLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 [--docs-sticky-top:calc(3.5rem+2.75rem)] [--sidebar-width:15rem] lg:[--docs-sticky-top:5rem]">
      <div className="bg-card/80 border-border sticky top-14 z-20 -mx-1 flex items-center gap-3 rounded-xl border px-3 py-2 backdrop-blur-sm lg:hidden">
        <DocsMobileNav />
        <p className="text-muted-foreground truncate text-sm">Browse documentation</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div
            data-docs-sidebar
            className="bg-card border-border sticky top-[var(--docs-sticky-top)] max-h-[calc(100vh-var(--docs-sticky-top)-1.5rem)] overflow-hidden rounded-xl border shadow-xs"
          >
            <div className="border-border border-b px-3 py-2.5">
              <p className="text-foreground text-sm font-semibold">Documentation</p>
              <p className="text-muted-foreground text-xs">Browse all guides</p>
            </div>
            <div className="max-h-[calc(100vh-8.5rem)] overflow-y-auto p-3">
              <DocsSidebar />
            </div>
          </div>
        </aside>
        <div className="min-w-0 pb-12">{children}</div>
      </div>
    </div>
  );
}
