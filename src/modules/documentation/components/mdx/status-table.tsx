import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

export function StatusTable({
  rows,
}: {
  rows: Array<{
    status: string;
    meaning: string;
    actions: string;
    effect: string;
  }>;
}) {
  return (
    <div className="not-prose my-4 overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Meaning</TableHead>
            <TableHead>Available actions</TableHead>
            <TableHead>Stock / accounting effect</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.status}>
              <TableCell className="font-mono text-xs font-medium uppercase">{row.status.replace(/_/g, " ")}</TableCell>
              <TableCell>{row.meaning}</TableCell>
              <TableCell>{row.actions}</TableCell>
              <TableCell>{row.effect}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
