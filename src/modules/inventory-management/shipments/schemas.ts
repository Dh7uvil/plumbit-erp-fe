import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { NullableDecimalStringSchema } from "@/shared/lib/money";

export const SHIPMENT_STATUSES = [
  "DRAFT",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
  "CLOSED",
  "CANCELLED",
] as const;
export const ShipmentStatusSchema = z.enum(SHIPMENT_STATUSES);
export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  IN_TRANSIT: "In transit",
  ARRIVED: "Arrived",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const SHIPMENT_STATUS_VARIANTS: Record<
  ShipmentStatus,
  "muted" | "info" | "warning" | "success" | "secondary" | "destructive"
> = {
  DRAFT: "muted",
  DISPATCHED: "info",
  IN_TRANSIT: "warning",
  ARRIVED: "success",
  CLOSED: "secondary",
  CANCELLED: "destructive",
};

export const SHIPMENT_TYPES = ["IMPORT", "EXPORT", "DOMESTIC"] as const;
export const ShipmentTypeSchema = z.enum(SHIPMENT_TYPES);
export type ShipmentType = z.infer<typeof ShipmentTypeSchema>;
export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  IMPORT: "Import",
  EXPORT: "Export",
  DOMESTIC: "Domestic",
};

export const TRANSPORT_MODES = ["SEA", "AIR", "ROAD", "RAIL", "COURIER"] as const;
export const TransportModeSchema = z.enum(TRANSPORT_MODES);
export type TransportMode = z.infer<typeof TransportModeSchema>;
export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  SEA: "Sea",
  AIR: "Air",
  ROAD: "Road",
  RAIL: "Rail",
  COURIER: "Courier",
};

export const INCOTERMS = [
  "EXW",
  "FCA",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
] as const;
export const IncotermSchema = z.enum(INCOTERMS);
export type Incoterm = z.infer<typeof IncotermSchema>;
export const INCOTERM_LABELS: Record<Incoterm, string> = {
  EXW: "EXW",
  FCA: "FCA",
  FAS: "FAS",
  FOB: "FOB",
  CFR: "CFR",
  CIF: "CIF",
  CPT: "CPT",
  CIP: "CIP",
  DAP: "DAP",
  DPU: "DPU",
  DDP: "DDP",
};

export const ShipmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: ShipmentStatusSchema,
  version: z.number().int(),
  shipment_type: ShipmentTypeSchema,
  transport_mode: TransportModeSchema,
  incoterm: IncotermSchema.nullable(),
  container_number: z.string().nullable(),
  seal_number: z.string().nullable(),
  carrier_name: z.string().nullable(),
  vessel_or_flight_no: z.string().nullable(),
  voyage_number: z.string().nullable(),
  bl_awb_number: z.string().nullable(),
  bl_awb_date: z.string().nullable(),
  freight_forwarder_id: z.string().uuid().nullable(),
  port_of_loading: z.string().nullable(),
  port_of_discharge: z.string().nullable(),
  etd: z.string().nullable(),
  eta: z.string().nullable(),
  actual_departure_date: z.string().nullable(),
  actual_arrival_date: z.string().nullable(),
  gross_weight: NullableDecimalStringSchema,
  net_weight: NullableDecimalStringSchema,
  total_packages: z.number().int().nullable(),
  notes: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Shipment = z.infer<typeof ShipmentSchema>;
export const ShipmentListSchema = z.array(ShipmentSchema);

export const ShipmentCreateRequestSchema = z.object({
  shipment_type: ShipmentTypeSchema,
  transport_mode: TransportModeSchema,
  incoterm: IncotermSchema.nullable().optional(),
  container_number: z.string().nullable().optional(),
  seal_number: z.string().nullable().optional(),
  carrier_name: z.string().nullable().optional(),
  vessel_or_flight_no: z.string().nullable().optional(),
  voyage_number: z.string().nullable().optional(),
  bl_awb_number: z.string().nullable().optional(),
  bl_awb_date: z.string().nullable().optional(),
  freight_forwarder_id: z.string().uuid().nullable().optional(),
  port_of_loading: z.string().nullable().optional(),
  port_of_discharge: z.string().nullable().optional(),
  etd: z.string().nullable().optional(),
  eta: z.string().nullable().optional(),
  gross_weight: NullableDecimalStringSchema.optional(),
  net_weight: NullableDecimalStringSchema.optional(),
  total_packages: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type ShipmentCreateRequest = z.infer<typeof ShipmentCreateRequestSchema>;

export const ShipmentUpdateRequestSchema = ShipmentCreateRequestSchema.partial().extend({
  version: z.number().int().optional(),
});
export type ShipmentUpdateRequest = z.infer<typeof ShipmentUpdateRequestSchema>;

export const ShipmentTrackingUpdateSchema = z.object({
  carrier_name: z.string().nullable().optional(),
  vessel_or_flight_no: z.string().nullable().optional(),
  voyage_number: z.string().nullable().optional(),
  bl_awb_number: z.string().nullable().optional(),
  bl_awb_date: z.string().nullable().optional(),
  etd: z.string().nullable().optional(),
  eta: z.string().nullable().optional(),
  actual_departure_date: z.string().nullable().optional(),
  actual_arrival_date: z.string().nullable().optional(),
  version: z.number().int().optional(),
});
export type ShipmentTrackingUpdate = z.infer<typeof ShipmentTrackingUpdateSchema>;

function hasId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export const ShipmentFormSchema = z.object({
  shipment_type: ShipmentTypeSchema,
  transport_mode: TransportModeSchema,
  incoterm: z.string(),
  container_number: z.string(),
  seal_number: z.string(),
  carrier_name: z.string(),
  vessel_or_flight_no: z.string(),
  voyage_number: z.string(),
  bl_awb_number: z.string(),
  bl_awb_date: z.string(),
  freight_forwarder_id: z.string(),
  port_of_loading: z.string(),
  port_of_discharge: z.string(),
  etd: z.string(),
  eta: z.string(),
  gross_weight: z.string(),
  net_weight: z.string(),
  total_packages: z.string(),
  notes: z.string(),
});
export type ShipmentFormValues = z.infer<typeof ShipmentFormSchema>;

export const ShipmentTrackingFormSchema = z.object({
  carrier_name: z.string(),
  vessel_or_flight_no: z.string(),
  voyage_number: z.string(),
  bl_awb_number: z.string(),
  bl_awb_date: z.string(),
  etd: z.string(),
  eta: z.string(),
  actual_departure_date: z.string(),
  actual_arrival_date: z.string(),
});
export type ShipmentTrackingFormValues = z.infer<typeof ShipmentTrackingFormSchema>;

export type ShipmentListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: ShipmentStatus;
  shipment_type?: ShipmentType;
  transport_mode?: TransportMode;
};

export function shipmentDisplayNumber(document: Pick<Shipment, "document_number">): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}

export function parseShipmentStatus(value: string | undefined): ShipmentStatus | undefined {
  return SHIPMENT_STATUSES.includes(value as ShipmentStatus)
    ? (value as ShipmentStatus)
    : undefined;
}

export function parseShipmentType(value: string | undefined): ShipmentType | undefined {
  return SHIPMENT_TYPES.includes(value as ShipmentType) ? (value as ShipmentType) : undefined;
}

export function optionalSelect(value: string): string | null {
  return hasId(value) ? value : null;
}

export const TRACKING_STEPS: ShipmentStatus[] = [
  "DRAFT",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
  "CLOSED",
];
