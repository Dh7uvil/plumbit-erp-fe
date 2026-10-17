import { OPTIONAL_SELECT_NONE } from "@/config/constants";

/** Maps a loaded source document onto shared commercial header form fields. */
export type SourceHeaderAutofillInput = {
  partyIdField?: "customer_id" | "supplier_id";
  partyId?: string;
  currencyId?: string | null;
  exchangeRate?: string | null;
  warehouseId?: string | null;
  paymentTermsId?: string | null;
  contactId?: string | null;
  salespersonId?: string | null;
  referenceNumber?: string | null;
  placeOfSupply?: string | null;
  taxTreatment?: string | null;
  partyTrn?: string | null;
  billToSnapshot?: string | null;
  shipToSnapshot?: string | null;
  supplierAddressSnapshot?: string | null;
};

export type SourceHeaderFormSlice = {
  customer_id?: string;
  supplier_id?: string;
  currency_id?: string;
  exchange_rate?: string;
  warehouse_id?: string;
  payment_terms_id?: string;
  contact_id?: string;
  salesperson_id?: string;
  reference_number?: string;
  place_of_supply?: string;
  tax_treatment?: string;
  customer_trn?: string;
  supplier_trn?: string;
  bill_to_snapshot?: string;
  ship_to_snapshot?: string;
  supplier_address_snapshot?: string;
};

function optionalSelect(value: string | null | undefined): string {
  return value && value !== OPTIONAL_SELECT_NONE ? value : OPTIONAL_SELECT_NONE;
}

export function mapSourceToHeaderValues(source: SourceHeaderAutofillInput): SourceHeaderFormSlice {
  const values: SourceHeaderFormSlice = {};
  if (source.partyId && source.partyIdField === "customer_id") {
    values.customer_id = source.partyId;
    if (source.partyTrn !== undefined) {
      values.customer_trn = source.partyTrn ?? "";
    }
  } else if (source.partyId && source.partyIdField === "supplier_id") {
    values.supplier_id = source.partyId;
    if (source.partyTrn !== undefined) {
      values.supplier_trn = source.partyTrn ?? "";
    }
  }
  if (source.currencyId) {
    values.currency_id = source.currencyId;
  }
  if (source.exchangeRate) {
    values.exchange_rate = source.exchangeRate;
  }
  if (source.warehouseId !== undefined) {
    values.warehouse_id = optionalSelect(source.warehouseId);
  }
  if (source.paymentTermsId !== undefined) {
    values.payment_terms_id = optionalSelect(source.paymentTermsId);
  }
  if (source.contactId !== undefined) {
    values.contact_id = optionalSelect(source.contactId);
  }
  if (source.salespersonId !== undefined) {
    values.salesperson_id = optionalSelect(source.salespersonId);
  }
  if (source.referenceNumber !== undefined) {
    values.reference_number = source.referenceNumber ?? "";
  }
  if (source.placeOfSupply) {
    values.place_of_supply = source.placeOfSupply;
  }
  if (source.taxTreatment) {
    values.tax_treatment = source.taxTreatment;
  }
  if (source.billToSnapshot !== undefined) {
    values.bill_to_snapshot = source.billToSnapshot ?? "";
  }
  if (source.shipToSnapshot !== undefined) {
    values.ship_to_snapshot = source.shipToSnapshot ?? "";
  }
  if (source.supplierAddressSnapshot !== undefined) {
    values.supplier_address_snapshot = source.supplierAddressSnapshot ?? "";
  }
  return values;
}
