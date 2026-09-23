"use client";

import { useState } from "react";
import { toast } from "sonner";

import { reportsApi } from "@/modules/erp/accounting/reports/api";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import type { RequestParams } from "@/shared/api/client";
import { useCan } from "@/shared/providers/session-provider";

export function useReportCsv() {
  const can = useCan();
  const canExport = can(reportPermissions.export);
  const [csvPending, setCsvPending] = useState(false);
  const [excelPending, setExcelPending] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);

  async function downloadCsv(path: string, params: RequestParams, filename: string) {
    if (!canExport) {
      toast.error("You do not have permission to export reports.");
      return;
    }
    setCsvPending(true);
    try {
      await reportsApi.downloadCsv(path, params, filename);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCsvPending(false);
    }
  }

  async function downloadExcel(path: string, params: RequestParams, filename: string) {
    if (!canExport) {
      toast.error("You do not have permission to export reports.");
      return;
    }
    setExcelPending(true);
    try {
      await reportsApi.downloadExcel(path, params, filename);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExcelPending(false);
    }
  }

  async function downloadPdf(path: string, params: RequestParams, filename: string) {
    if (!canExport) {
      toast.error("You do not have permission to export reports.");
      return;
    }
    setPdfPending(true);
    setQueueMessage("Preparing PDF");
    try {
      await reportsApi.downloadPdf(path, params, filename);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPdfPending(false);
      setQueueMessage(null);
    }
  }

  async function queueExport(
    report: string,
    exportFormat: "csv" | "xlsx" | "pdf",
    params: Record<string, string>,
  ) {
    if (!canExport) {
      toast.error("You do not have permission to export reports.");
      return;
    }
    setPdfPending(true);
    setQueueMessage("Queued");
    try {
      let job = await reportsApi.queueExport({
        report,
        export_format: exportFormat,
        params,
      });
      for (let attempt = 0; attempt < 20 && job.status === "PENDING"; attempt += 1) {
        setQueueMessage("Preparing export");
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        job = await reportsApi.getExport(job.id);
      }
      if (job.status !== "READY" || !job.filename) {
        throw new Error(job.error ?? "Export failed");
      }
      setQueueMessage("Downloading");
      await reportsApi.downloadQueued(job.id, job.filename);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPdfPending(false);
      setQueueMessage(null);
    }
  }

  return {
    csvPending,
    excelPending,
    pdfPending,
    queueMessage,
    downloadCsv,
    downloadExcel,
    downloadPdf,
    queueExport,
    canExport,
  };
}
