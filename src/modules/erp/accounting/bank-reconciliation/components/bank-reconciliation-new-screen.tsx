"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllBankAccounts } from "@/modules/erp/accounting/bank-accounts/queries";
import { bankReconciliationApi } from "@/modules/erp/accounting/bank-reconciliation/api";
import { useCreateBankStatement } from "@/modules/erp/accounting/bank-reconciliation/mutations";
import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCan } from "@/shared/providers/session-provider";
import { PageHeader } from "@/shared/components/layout/page-header";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { imexApi, type ImexMappingEntry, type ImportPreview } from "@/shared/lib/imex";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function BankReconciliationNewScreen() {
  const router = useRouter();
  const can = useCan();
  const canCreate = can(bankReconciliationPermissions.create);
  const canImport = can(bankReconciliationPermissions.import);
  const createStatement = useCreateBankStatement();
  const bankAccountsQuery = useAllBankAccounts();
  const bankAccounts = bankAccountsQuery.data ?? [];

  const [bankAccountId, setBankAccountId] = useState("");
  const [periodStart, setPeriodStart] = useState(todayIsoDate());
  const [periodEnd, setPeriodEnd] = useState(todayIsoDate());
  const [openingBalance, setOpeningBalance] = useState("0");
  const [closingBalance, setClosingBalance] = useState("0");
  const [notes, setNotes] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<ImexMappingEntry[]>([]);
  const [importPending, setImportPending] = useState(false);
  const [templatePending, setTemplatePending] = useState(false);

  const catalogFields = useMemo(() => {
    const fields = new Set(mapping.map((entry) => entry.field).filter(Boolean));
    return [...fields].sort();
  }, [mapping]);

  async function createEmptyStatement() {
    if (!bankAccountId) {
      toast.error("Select a bank account");
      return;
    }
    try {
      const created = await createStatement.mutateAsync({
        bank_account_id: bankAccountId,
        period_start: periodStart,
        period_end: periodEnd,
        opening_balance: openingBalance.trim() || "0",
        closing_balance: closingBalance.trim() || "0",
        notes: notes.trim() || null,
        lines: [],
      });
      toast.success("Bank statement created");
      router.push(`/bank-reconciliation/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onPreview() {
    if (!file) {
      return;
    }
    setImportPending(true);
    try {
      const next = await imexApi.preview("bank-reconciliation", file);
      setPreview(next);
      setMapping(
        next.columns.map((column) => {
          const suggested = next.suggested_mapping.find((entry) => entry.column === column.header);
          return { column: column.header, field: suggested?.field ?? "" };
        }),
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setImportPending(false);
    }
  }

  async function onImport() {
    if (!file || !bankAccountId) {
      toast.error("Select a bank account and file");
      return;
    }
    setImportPending(true);
    try {
      const result = await bankReconciliationApi.importFile(
        file,
        mapping.filter((entry) => entry.field.trim()),
        {
          bank_account_id: bankAccountId,
          period_start: periodStart,
          period_end: periodEnd,
          opening_balance: openingBalance.trim() || "0",
          closing_balance: closingBalance.trim() || "0",
        },
      );
      if (result.created_ids[0]) {
        toast.success("Bank statement imported");
        router.push(`/bank-reconciliation/${result.created_ids[0]}`);
        return;
      }
      if (result.error_count > 0) {
        toast.error(`${result.error_count} row(s) failed to import`);
      } else {
        toast.error("Import did not create a statement");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setImportPending(false);
    }
  }

  const metadataFields = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Bank account</Label>
        <Select value={bankAccountId} onValueChange={setBankAccountId}>
          <SelectTrigger>
            <SelectValue placeholder="Select bank account" />
          </SelectTrigger>
          <SelectContent>
            {bankAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_name} — {account.bank_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Period start</Label>
        <Input
          type="date"
          value={periodStart}
          onChange={(event) => setPeriodStart(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Period end</Label>
        <Input
          type="date"
          value={periodEnd}
          onChange={(event) => setPeriodEnd(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Opening balance</Label>
        <DecimalInput
          kind="money"
          value={openingBalance}
          onChange={(event) => setOpeningBalance(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Closing balance</Label>
        <DecimalInput
          kind="money"
          value={closingBalance}
          onChange={(event) => setClosingBalance(event.target.value)}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Notes</Label>
        <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New bank statement"
        subtitle="Create an empty statement or import lines from Excel/CSV."
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/bank-reconciliation">Back</Link>
          </Button>
        }
      />
      <Tabs defaultValue={canImport ? "import" : "manual"}>
        <TabsList>
          {canImport ? <TabsTrigger value="import">Import file</TabsTrigger> : null}
          {canCreate ? <TabsTrigger value="manual">Empty statement</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create empty statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metadataFields}
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void createEmptyStatement()}
                  disabled={createStatement.isPending}
                >
                  Create statement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {canImport ? (
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import statement lines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metadataFields}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={templatePending}
                    onClick={async () => {
                      setTemplatePending(true);
                      try {
                        await imexApi.downloadTemplate(
                          "bank-reconciliation",
                          "bank-statement-template.xlsx",
                        );
                      } catch (error) {
                        toast.error(getErrorMessage(error));
                      } finally {
                        setTemplatePending(false);
                      }
                    }}
                  >
                    {templatePending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Download template
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank-statement-file">File</Label>
                  <Input
                    id="bank-statement-file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
                      setPreview(null);
                    }}
                  />
                </div>
                {preview ? (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-medium">File column</th>
                          <th className="px-3 py-2 text-left font-medium">Maps to</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mapping.map((entry, index) => (
                          <tr key={entry.column} className="border-b last:border-0">
                            <td className="px-3 py-2">{entry.column}</td>
                            <td className="px-3 py-2">
                              <Input
                                value={entry.field}
                                list="bank-statement-imex-fields"
                                aria-label={`Map ${entry.column}`}
                                onChange={(event) => {
                                  const next = [...mapping];
                                  next[index] = { ...entry, field: event.target.value };
                                  setMapping(next);
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <datalist id="bank-statement-imex-fields">
                      {catalogFields.map((field) => (
                        <option key={field} value={field} />
                      ))}
                    </datalist>
                  </div>
                ) : null}
                <div className="flex justify-end gap-2">
                  {preview ? (
                    <Button
                      type="button"
                      disabled={!file || importPending}
                      onClick={() => void onImport()}
                    >
                      {importPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Import statement
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={!file || importPending}
                      onClick={() => void onPreview()}
                    >
                      {importPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Preview columns
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
