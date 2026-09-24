import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function Prerequisites({
  title = "Prerequisites",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="not-prose my-4 gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground px-4 pb-4 text-sm [&_ul]:my-0 [&_ul]:list-disc [&_ul]:ps-5">
        {children}
      </CardContent>
    </Card>
  );
}

export function Example({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card className="not-prose bg-muted/30 my-4 gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm">{title ?? "Example"}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground px-4 pb-4 text-sm [&_p]:my-1">{children}</CardContent>
    </Card>
  );
}
