import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

export function StateChangeTable({
  rows,
}: {
  rows: Array<{
    action: string;
    stock: string;
    reserved?: string;
    gl: string;
    tax: string;
    documents: string;
  }>;
}) {
  return (
    <div className="not-prose my-4 overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Stock on hand</TableHead>
            <TableHead>Reserved / incoming / QC</TableHead>
            <TableHead>GL / AP / AR</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead>Status / next documents</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.action}>
              <TableCell className="font-medium">{row.action}</TableCell>
              <TableCell>{row.stock}</TableCell>
              <TableCell>{row.reserved ?? "—"}</TableCell>
              <TableCell>{row.gl}</TableCell>
              <TableCell>{row.tax}</TableCell>
              <TableCell>{row.documents}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
