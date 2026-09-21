"use client";

import { useState } from "react";
import { toast } from "sonner";

import { crmReportsApi } from "@/modules/crm/reports/api";
import { crmReportPermissions } from "@/modules/crm/reports/permissions";
import type { RequestParams } from "@/shared/api/client";
import { getErrorMessage } from "@/shared/api/errors";
import { useCan } from "@/shared/providers/session-provider";

export function useCrmReportCsv() {
  const can = useCan();
  const canExport = can(crmReportPermissions.export);
  const [csvPending, setCsvPending] = useState(false);
  const [excelPending, setExcelPending] = useState(false);

  async function downloadCsv(path: string, params: RequestParams, filename: string) {
    if (!canExport) {
      toast.error("You do not have permission to export reports.");
      return;
    }
    setCsvPending(true);
    try {
      await crmReportsApi.downloadCsv(path, params, filename);
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
      await crmReportsApi.downloadExcel(path, params, filename);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExcelPending(false);
    }
  }

  return { csvPending, excelPending, downloadCsv, downloadExcel, canExport };
}
