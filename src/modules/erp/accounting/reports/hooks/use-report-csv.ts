"use client";

import { useState } from "react";
import { toast } from "sonner";

import { reportsApi } from "@/modules/erp/accounting/reports/api";
import { getErrorMessage } from "@/shared/api/errors";
import type { RequestParams } from "@/shared/api/client";

export function useReportCsv() {
  const [csvPending, setCsvPending] = useState(false);

  async function downloadCsv(path: string, params: RequestParams, filename: string) {
    setCsvPending(true);
    try {
      await reportsApi.downloadCsv(path, params, filename);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCsvPending(false);
    }
  }

  return { csvPending, downloadCsv };
}
