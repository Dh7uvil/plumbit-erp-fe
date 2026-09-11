"use client";

import { useEffect } from "react";

import type { PrintDocument } from "@/shared/lib/print";
import { formatDate, formatDecimal } from "@/shared/lib/format";

function showChina(doc: PrintDocument): boolean {
  return doc.template_family.toLowerCase() === "china";
}

export function PrintDocumentView({ document }: { document: PrintDocument }) {
  const china = showChina(document);
  const letterhead = document.letterhead;

  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [document.document_id, document.template_family]);

  return (
    <article className="mx-auto max-w-[210mm] bg-white p-8 text-black print:max-w-none print:p-0">
      <header className="border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            {letterhead.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- print letterhead uses tenant logo URL
              <img src={letterhead.logo_url} alt="" className="mb-2 h-12 object-contain" />
            ) : null}
            <p className="text-lg font-semibold">{letterhead.company_name}</p>
            {letterhead.address ? <p className="text-sm whitespace-pre-wrap">{letterhead.address}</p> : null}
            <p className="text-sm">
              {[letterhead.phone, letterhead.email, letterhead.website].filter(Boolean).join(" · ")}
            </p>
            {letterhead.trn ? <p className="text-sm">TRN: {letterhead.trn}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold tracking-tight">
              {china ? chinaTitle(document.document_type) : uaeTitle(document.document_type)}
            </p>
            <p className="font-mono text-sm">{document.document_number}</p>
            <p className="text-sm">{formatDate(document.document_date)}</p>
          </div>
        </div>
      </header>
      <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">{document.customer_name}</p>
          {document.customer_code ? <p>Customer code: {document.customer_code}</p> : null}
          {document.customer_trn ? <p>TRN: {document.customer_trn}</p> : null}
          {document.customer_address ? (
            <p className="whitespace-pre-wrap">{document.customer_address}</p>
          ) : null}
        </div>
        <div className="text-right">
          {document.lpo_number ? <p>L.P.O.: {document.lpo_number}</p> : null}
          {document.delivery_note_number ? <p>D.O. / DN: {document.delivery_note_number}</p> : null}
          {document.invoice_number ? <p>Invoice: {document.invoice_number}</p> : null}
          {document.bl_number ? <p>B/L: {document.bl_number}</p> : null}
          {document.container_number ? <p>Container: {document.container_number}</p> : null}
          {document.incoterm ? (
            <p>
              Incoterm: {document.incoterm}
              {document.incoterm_place ? ` ${document.incoterm_place}` : ""}
            </p>
          ) : null}
          {document.payment_terms ? <p>Payment terms: {document.payment_terms}</p> : null}
        </div>
      </section>
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y">
            <th className="py-2 text-left font-medium">#</th>
            <th className="py-2 text-left font-medium">Item</th>
            <th className="py-2 text-left font-medium">Description</th>
            {china ? <th className="py-2 text-right font-medium">CTNS</th> : null}
            {china ? <th className="py-2 text-left font-medium">PKG</th> : null}
            <th className="py-2 text-right font-medium">Qty</th>
            {china ? <th className="py-2 text-right font-medium">CBM</th> : null}
            {china ? <th className="py-2 text-right font-medium">Weight</th> : null}
            <th className="py-2 text-right font-medium">Rate</th>
            {!china ? <th className="py-2 text-right font-medium">Taxable</th> : null}
            {!china ? <th className="py-2 text-right font-medium">VAT</th> : null}
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {document.lines.map((line) => (
            <tr key={line.line_number} className="border-b">
              <td className="py-1.5">{line.line_number}</td>
              <td className="py-1.5">{line.item_code ?? ""}</td>
              <td className="py-1.5">{line.description}</td>
              {china ? (
                <td className="py-1.5 text-right tabular-nums">{line.carton_qty ?? ""}</td>
              ) : null}
              {china ? <td className="py-1.5">{line.packing_unit ?? ""}</td> : null}
              <td className="py-1.5 text-right tabular-nums">{formatDecimal(line.quantity)}</td>
              {china ? (
                <td className="py-1.5 text-right tabular-nums">
                  {line.cbm ? formatDecimal(line.cbm) : ""}
                </td>
              ) : null}
              {china ? (
                <td className="py-1.5 text-right tabular-nums">
                  {line.weight ? formatDecimal(line.weight) : ""}
                </td>
              ) : null}
              <td className="py-1.5 text-right tabular-nums">
                {line.unit_price ? formatDecimal(line.unit_price) : ""}
              </td>
              {!china ? (
                <td className="py-1.5 text-right tabular-nums">
                  {line.taxable_amount ? formatDecimal(line.taxable_amount) : ""}
                </td>
              ) : null}
              {!china ? (
                <td className="py-1.5 text-right tabular-nums">
                  {line.tax_amount ? formatDecimal(line.tax_amount) : ""}
                </td>
              ) : null}
              <td className="py-1.5 text-right tabular-nums">
                {line.amount ? formatDecimal(line.amount) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="mt-4 flex justify-end text-sm">
        <dl className="grid min-w-64 grid-cols-2 gap-x-4 gap-y-1">
          {document.subtotal ? (
            <>
              <dt>Subtotal</dt>
              <dd className="text-right tabular-nums">
                {formatDecimal(document.subtotal)} {document.currency_code}
              </dd>
            </>
          ) : null}
          {document.tax_amount ? (
            <>
              <dt>VAT</dt>
              <dd className="text-right tabular-nums">
                {formatDecimal(document.tax_amount)} {document.currency_code}
              </dd>
            </>
          ) : null}
          {document.grand_total ? (
            <>
              <dt className="font-medium">Total</dt>
              <dd className="text-right font-medium tabular-nums">
                {formatDecimal(document.grand_total)} {document.currency_code}
              </dd>
            </>
          ) : null}
        </dl>
      </section>
      {document.amount_in_words ? (
        <p className="mt-3 text-sm">Amount in words: {document.amount_in_words}</p>
      ) : null}
      {document.notes ? <p className="mt-3 text-sm whitespace-pre-wrap">{document.notes}</p> : null}
      {china && letterhead.bank_details ? (
        <p className="mt-4 text-sm whitespace-pre-wrap">{letterhead.bank_details}</p>
      ) : null}
      <footer className="mt-12 grid grid-cols-2 gap-8 text-sm">
        <p>Received by ______________________</p>
        <p className="text-right">Authorized signatory ______________________</p>
      </footer>
    </article>
  );
}

function uaeTitle(type: string): string {
  const key = type.toUpperCase();
  if (key.includes("INVOICE")) return "TAX INVOICE";
  if (key.includes("DELIVERY")) return "DELIVERY NOTE";
  if (key.includes("QUOTATION")) return "QUOTATION";
  if (key.includes("PROFORMA")) return "PROFORMA INVOICE";
  return key.replaceAll("_", " ");
}

function chinaTitle(type: string): string {
  const key = type.toUpperCase();
  if (key.includes("INVOICE")) return "COMMERCIAL INVOICE";
  if (key.includes("PACKAGE") || key.includes("PACKING")) return "PACKING LIST";
  if (key.includes("QUOTATION")) return "QUOTATION";
  if (key.includes("PROFORMA")) return "PROFORMA INVOICE";
  return key.replaceAll("_", " ");
}
