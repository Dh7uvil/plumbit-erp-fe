"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  imexApi,
  type ImexMappingEntry,
  type ImportPreview,
  type ImportResult,
} from "@/shared/lib/imex";

export function ImportWizardDialog({
  open,
  onOpenChange,
  resource,
  title,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: string;
  title: string;
  onImported?: (result: ImportResult) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<ImexMappingEntry[]>([]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const catalogFields = useMemo(() => {
    const fields = new Set(mapping.map((entry) => entry.field).filter(Boolean));
    return [...fields].sort();
  }, [mapping]);

  function reset() {
    setFile(null);
    setPreview(null);
    setMapping([]);
    setResult(null);
  }

  async function onPreview() {
    if (!file) {
      return;
    }
    setPending(true);
    try {
      const next = await imexApi.preview(resource, file);
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
      setPending(false);
    }
  }

  async function onImport() {
    if (!file) {
      return;
    }
    setPending(true);
    try {
      const imported = await imexApi.importFile(
        resource,
        file,
        mapping.filter((entry) => entry.field.trim()),
      );
      setResult(imported);
      if (imported.created_count > 0) {
        toast.success(
          imported.created_count === 1
            ? "1 draft created"
            : `${imported.created_count} drafts created`,
        );
      }
      if (imported.error_count > 0) {
        toast.error(
          imported.error_count === 1 ? "1 row failed" : `${imported.error_count} rows failed`,
        );
      }
      onImported?.(imported);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {title}</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file, map columns, and create drafts. Posted records are never
            created from import.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${resource}-import-file`}>File</Label>
            <Input
              id={`${resource}-import-file`}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
                setResult(null);
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
                          list={`${resource}-imex-fields`}
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
              <datalist id={`${resource}-imex-fields`}>
                {catalogFields.map((field) => (
                  <option key={field} value={field} />
                ))}
              </datalist>
            </div>
          ) : null}
          {preview ? (
            <p className="text-muted-foreground text-xs">
              {preview.row_count} data row{preview.row_count === 1 ? "" : "s"} detected.
            </p>
          ) : null}
          {result ? (
            <div className="flex flex-col gap-1 text-sm">
              <p>
                Created {result.created_count} draft{result.created_count === 1 ? "" : "s"}.
              </p>
              {result.errors.length > 0 ? (
                <ul className="text-destructive list-disc pl-5">
                  {result.errors.slice(0, 20).map((error) => (
                    <li key={`${error.row_number}-${error.message}`}>
                      Row {error.row_number}: {error.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {preview ? (
            <Button type="button" disabled={!file || pending} onClick={() => void onImport()}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Import drafts
            </Button>
          ) : (
            <Button type="button" disabled={!file || pending} onClick={() => void onPreview()}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Preview columns
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
