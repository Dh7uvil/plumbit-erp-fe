"use client";

import { useEffect } from "react";

import type { PrintDocument } from "@/shared/lib/print";
import { formatDate, formatMoney, formatQuantity, humanizeEnum } from "@/shared/lib/format";

function showChina(doc: PrintDocument): boolean {
  return doc.template_family.toLowerCase() === "china";
}

function isAccountingDocument(doc: PrintDocument): boolean {
  const kind = doc.template_kind.toLowerCase();
  return kind === "voucher" || kind === "journal" || kind === "cheque";
}

export function PrintDocumentView({ document }: { document: PrintDocument }) {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [document.document_id, document.template_family]);

  if (isAccountingDocument(document)) {
    return <AccountingPrintDocumentView document={document} />;
  }

  return <CommercialPrintDocumentView document={document} />;
}

function CommercialPrintDocumentView({ document }: { document: PrintDocument }) {
  const china = showChina(document);
  const letterhead = document.letterhead;
  const currency = document.currency_code ?? "";

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
            {letterhead.address ? (
              <p className="text-sm whitespace-pre-wrap">{letterhead.address}</p>
            ) : null}
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
                <td className="py-1.5 text-right tabular-nums">
                  {line.carton_qty ? formatQuantity(line.carton_qty) : ""}
                </td>
              ) : null}
              {china ? <td className="py-1.5">{line.packing_unit ?? ""}</td> : null}
              <td className="py-1.5 text-right tabular-nums">{formatQuantity(line.quantity)}</td>
              {china ? (
                <td className="py-1.5 text-right tabular-nums">
                  {line.cbm ? formatQuantity(line.cbm) : ""}
                </td>
              ) : null}
              {china ? (
                <td className="py-1.5 text-right tabular-nums">
                  {line.weight ? formatQuantity(line.weight) : ""}
                </td>
              ) : null}
              <td className="py-1.5 text-right tabular-nums">
                {line.unit_price ? formatMoney(line.unit_price, currency) : ""}
              </td>
              {!china ? (
                <td className="py-1.5 text-right tabular-nums">
                  {line.taxable_amount ? formatMoney(line.taxable_amount, currency) : ""}
                </td>
              ) : null}
              {!china ? (
                <td className="py-1.5 text-right tabular-nums">
                  {line.tax_amount ? formatMoney(line.tax_amount, currency) : ""}
                </td>
              ) : null}
              <td className="py-1.5 text-right tabular-nums">
                {line.amount ? formatMoney(line.amount, currency) : ""}
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
                {formatMoney(document.subtotal, currency)}
              </dd>
            </>
          ) : null}
          {document.tax_amount ? (
            <>
              <dt>VAT</dt>
              <dd className="text-right tabular-nums">
                {formatMoney(document.tax_amount, currency)}
              </dd>
            </>
          ) : null}
          {document.grand_total ? (
            <>
              <dt className="font-medium">Total</dt>
              <dd className="text-right font-medium tabular-nums">
                {formatMoney(document.grand_total, currency)}
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

function AccountingPrintDocumentView({ document }: { document: PrintDocument }) {
  const letterhead = document.letterhead;
  const currency = document.currency_code ?? "";
  const partyName = document.party_name ?? document.customer_name;
  const partyCode = document.party_code ?? document.customer_code;
  const kind = document.template_kind.toLowerCase();

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
            {letterhead.address ? (
              <p className="text-sm whitespace-pre-wrap">{letterhead.address}</p>
            ) : null}
            <p className="text-sm">
              {[letterhead.phone, letterhead.email, letterhead.website].filter(Boolean).join(" · ")}
            </p>
            {letterhead.trn ? <p className="text-sm">TRN: {letterhead.trn}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold tracking-tight">
              {accountingTitle(document)}
            </p>
            <p className="font-mono text-sm">{document.document_number}</p>
            <p className="text-sm">{formatDate(document.document_date)}</p>
          </div>
        </div>
      </header>
      <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          {partyName ? <p className="font-medium">{partyName}</p> : null}
          {partyCode ? <p>Party code: {partyCode}</p> : null}
          {kind === "cheque" && document.cheque_number ? (
            <p>Cheque no.: {document.cheque_number}</p>
          ) : null}
          {document.payment_method ? (
            <p>Payment method: {humanizeEnum(document.payment_method)}</p>
          ) : null}
          {document.reference ? <p>Reference: {document.reference}</p> : null}
        </div>
        <div className="text-right">
          {document.cheque_date ? <p>Cheque date: {formatDate(document.cheque_date)}</p> : null}
          {document.due_date ? <p>Due date: {formatDate(document.due_date)}</p> : null}
          {document.voucher_type ? (
            <p>Voucher type: {humanizeEnum(document.voucher_type)}</p>
          ) : null}
        </div>
      </section>
      {document.journal_lines.length > 0 ? (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y">
              <th className="py-2 text-left font-medium">#</th>
              <th className="py-2 text-left font-medium">Account</th>
              <th className="py-2 text-left font-medium">Description</th>
              <th className="py-2 text-right font-medium">Debit</th>
              <th className="py-2 text-right font-medium">Credit</th>
            </tr>
          </thead>
          <tbody>
            {document.journal_lines.map((line) => (
              <tr key={line.line_number} className="border-b">
                <td className="py-1.5">{line.line_number}</td>
                <td className="py-1.5">
                  {line.account_code ? `${line.account_code} — ` : ""}
                  {line.account_name}
                </td>
                <td className="py-1.5">{line.description ?? ""}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {line.debit ? formatMoney(line.debit, currency) : ""}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {line.credit ? formatMoney(line.credit, currency) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <section className="mt-4 flex justify-end text-sm">
        {document.grand_total ? (
          <dl className="grid min-w-64 grid-cols-2 gap-x-4 gap-y-1">
            <dt className="font-medium">Amount</dt>
            <dd className="text-right font-medium tabular-nums">
              {formatMoney(document.grand_total, currency)}
            </dd>
          </dl>
        ) : null}
      </section>
      {document.amount_in_words ? (
        <p className="mt-3 text-sm font-medium">Amount in words: {document.amount_in_words}</p>
      ) : null}
      {document.narration ? (
        <p className="mt-3 text-sm whitespace-pre-wrap">{document.narration}</p>
      ) : null}
      {document.notes && document.notes !== document.narration ? (
        <p className="mt-3 text-sm whitespace-pre-wrap">{document.notes}</p>
      ) : null}
      <footer className="mt-12 grid grid-cols-2 gap-8 text-sm">
        <p>Received by ______________________</p>
        <p className="text-right">Authorized signatory ______________________</p>
      </footer>
    </article>
  );
}

function accountingTitle(document: PrintDocument): string {
  const kind = document.template_kind.toLowerCase();
  if (kind === "cheque") {
    return "CHEQUE";
  }
  if (kind === "journal") {
    return "JOURNAL VOUCHER";
  }
  if (document.voucher_type) {
    return humanizeEnum(document.voucher_type).toUpperCase();
  }
  return humanizeEnum(document.document_type).toUpperCase();
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
