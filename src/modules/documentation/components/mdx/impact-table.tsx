import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

export function ImpactTable({
  rows,
}: {
  rows: Array<{ action: string; stock: string; accounting: string }>;
}) {
  return (
    <div className="not-prose my-4 overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Stock effect</TableHead>
            <TableHead>Accounting effect</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.action}>
              <TableCell className="font-medium">{row.action}</TableCell>
              <TableCell>{row.stock}</TableCell>
              <TableCell>{row.accounting}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
