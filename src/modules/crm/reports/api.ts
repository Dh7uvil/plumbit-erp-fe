import {
  CrmDashboardSchema,
  LeadConversionSchema,
  SalesActivitySchema,
  SalesFunnelSchema,
  SalesPipelineSchema,
  WinLossSchema,
  type CrmDashboard,
  type CrmReportRangeParams,
  type LeadConversion,
  type SalesActivity,
  type SalesFunnel,
  type SalesFunnelParams,
  type SalesPipeline,
  type SalesPipelineParams,
  type WinLoss,
} from "@/modules/crm/reports/schemas";
import { apiClient } from "@/shared/api/client";
import type { RequestParams } from "@/shared/api/client";

export const crmReportsApi = {
  salesPipeline: async (params: SalesPipelineParams = {}): Promise<SalesPipeline> =>
    SalesPipelineSchema.parse(
      await apiClient.get("/reports/sales-pipeline", {
        params: { group_by: params.group_by, pipeline_id: params.pipeline_id },
      }),
    ),
  salesFunnel: async (params: SalesFunnelParams = {}): Promise<SalesFunnel> =>
    SalesFunnelSchema.parse(
      await apiClient.get("/reports/sales-funnel", {
        params: { pipeline_id: params.pipeline_id },
      }),
    ),
  winLoss: async (params: CrmReportRangeParams): Promise<WinLoss> =>
    WinLossSchema.parse(
      await apiClient.get("/reports/win-loss", {
        params: { from: params.from, to: params.to, group_by: params.group_by },
      }),
    ),
  leadConversion: async (params: CrmReportRangeParams): Promise<LeadConversion> =>
    LeadConversionSchema.parse(
      await apiClient.get("/reports/lead-conversion", {
        params: { from: params.from, to: params.to, group_by: params.group_by },
      }),
    ),
  salesActivity: async (params: CrmReportRangeParams): Promise<SalesActivity> =>
    SalesActivitySchema.parse(
      await apiClient.get("/reports/sales-activity", {
        params: { from: params.from, to: params.to, group_by: params.group_by },
      }),
    ),
  dashboard: async (): Promise<CrmDashboard> =>
    CrmDashboardSchema.parse(await apiClient.get("/reports/crm-dashboard")),
  downloadCsv: (path: string, params: RequestParams, filename: string): Promise<void> =>
    apiClient.downloadCsv(path, { params, filename }),
  downloadExcel: (path: string, params: RequestParams, filename: string): Promise<void> =>
    apiClient.downloadFile(path, {
      params: { ...params, format: "xlsx" },
      filename: filename.endsWith(".xls") ? filename : `${filename}.xls`,
      accept: "application/vnd.ms-excel",
    }),
};
