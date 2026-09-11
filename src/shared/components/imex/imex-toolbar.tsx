"use client";

import { Download, FileUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/api/errors";
import { ImportWizardDialog } from "@/shared/components/imex/import-wizard-dialog";
import { Button } from "@/shared/components/ui/button";
import { imexApi, type ImportResult } from "@/shared/lib/imex";
import type { RequestParams } from "@/shared/api/client";

const SHOW_IMEX_BUTTONS = false;

export function ImexToolbar({
  resource,
  title,
  canImport,
  canExport,
  exportParams,
  onImported,
}: {
  resource: string;
  title: string;
  canImport: boolean;
  canExport: boolean;
  exportParams?: RequestParams;
  onImported?: (result: ImportResult) => void;
}) {
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [templatePending, setTemplatePending] = useState(false);

  async function onExport() {
    setExporting(true);
    try {
      await imexApi.exportList(resource, exportParams ?? {}, `${resource}.xlsx`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  async function onTemplate() {
    setTemplatePending(true);
    try {
      await imexApi.downloadTemplate(resource, `${resource}-template.xlsx`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTemplatePending(false);
    }
  }

  if (!SHOW_IMEX_BUTTONS || (!canImport && !canExport)) {
    return null;
  }

  return (
    <>
      {canExport ? (
        <Button type="button" size="sm" variant="outline" disabled={exporting} onClick={() => void onExport()}>
          {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Export
        </Button>
      ) : null}
      {canImport ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={templatePending}
            onClick={() => void onTemplate()}
          >
            {templatePending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Template
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="size-3.5" />
            Import
          </Button>
          <ImportWizardDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            resource={resource}
            title={title}
            onImported={onImported}
          />
        </>
      ) : null}
    </>
  );
}
