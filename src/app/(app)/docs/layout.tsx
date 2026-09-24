import { DocsLayoutShell } from "@/modules/documentation/components/docs-layout-shell";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsLayoutShell>{children}</DocsLayoutShell>;
}
