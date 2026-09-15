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

  return { csvPending, excelPending, downloadCsv, downloadExcel, canExport };
}
