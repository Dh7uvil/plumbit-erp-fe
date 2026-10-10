"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { AccountPicker } from "@/modules/erp/accounting/accounts/components/account-picker";
import { getErrorMessage } from "@/shared/api/errors";
import { entryBooksApi, type EntryBook } from "@/modules/erp/accounting/entry-books/api";
import { useEntryBooks } from "@/modules/erp/accounting/entry-books/queries";
import { VOUCHER_ENTRY_BOOK_LABELS } from "@/modules/erp/accounting/vouchers/schemas";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

function EntryBookRow({ book }: { book: EntryBook }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(book.name);
  const [prefix, setPrefix] = useState(book.series_prefix);
  const [accountId, setAccountId] = useState(
    book.default_account_id ?? OPTIONAL_SELECT_NONE,
  );
  const [active, setActive] = useState(book.is_active);
  const save = useMutation({
    mutationFn: () =>
      entryBooksApi.update(book.id, {
        name,
        series_prefix: prefix,
        default_account_id:
          !accountId || accountId === OPTIONAL_SELECT_NONE ? null : accountId,
        is_active: active,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entry-books"] });
      toast.success("Entry book saved");
    },
    onError: () => toast.error("Could not save entry book"),
  });

  const typeLabel =
    VOUCHER_ENTRY_BOOK_LABELS[book.voucher_type as keyof typeof VOUCHER_ENTRY_BOOK_LABELS] ??
    book.voucher_type;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{book.voucher_type}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{typeLabel}</TableCell>
      <TableCell>
        <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
      </TableCell>
      <TableCell>
        <Input
          value={prefix}
          onChange={(event) => setPrefix(event.target.value)}
          className="w-24 font-mono"
          maxLength={20}
        />
      </TableCell>
      <TableCell className="min-w-56">
        <AccountPicker
          value={accountId}
          onValueChange={setAccountId}
          asFormControl={false}
          placeholder="None"
          searchPlaceholder="Default cash/bank…"
        />
      </TableCell>
      <TableCell>
        <Switch checked={active} onCheckedChange={setActive} />
      </TableCell>
      <TableCell>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function EntryBooksScreen() {
  const query = useEntryBooks();

  return (
    <ListPage>
      <PageHeader
        title="Entry books master"
        subtitle="Series prefixes and default cash or bank accounts for each voucher type. Used when allocating document numbers."
      />
      {query.isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {query.isError ? (
        <p className="text-destructive text-sm">
          {getErrorMessage(query.error) || "Could not load entry books."}
        </p>
      ) : null}
      {query.data ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Series</TableHead>
              <TableHead>Default account</TableHead>
              <TableHead>Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map((book) => (
              <EntryBookRow key={book.id} book={book} />
            ))}
          </TableBody>
        </Table>
      ) : null}
    </ListPage>
  );
}
