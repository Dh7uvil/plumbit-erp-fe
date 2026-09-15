"use client";

import Link from "next/link";

import {
  documentDetailHref,
  documentTypeDisplayLabel,
} from "@/shared/components/document/document-links";
import { documentStatusTone } from "@/shared/components/document/document-status-badge";
import type { RelatedDocumentRef } from "@/shared/components/document/schemas";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDate, formatFixedDecimal, formatQuantitySummary, humanizeEnum } from "@/shared/lib/format";

const RELATIONSHIP_LABELS: Record<string, string> = {
  source: "Source",
  child: "Created from this document",
};

function relationshipLabel(value: string): string {
  return RELATIONSHIP_LABELS[value] ?? humanizeEnum(value);
}

export function RelatedDocumentsCard({
  documents,
  title = "Related documents",
}: {
  documents: RelatedDocumentRef[];
  title?: string;
}) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {documents.map((document) => {
            const href = documentDetailHref(document.document_type, document.document_id);
            const typeLabel = documentTypeDisplayLabel(document.document_type);
            const number = document.document_number.trim() || typeLabel;
            return (
              <li
                key={`${document.document_type}-${document.document_id}-${document.relationship}`}
                className="border-border flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-sm"
              >
                <Badge variant="outline">{typeLabel}</Badge>
                {href ? (
                  <Link
                    href={href}
                    className="text-foreground font-medium underline-offset-4 hover:underline"
                  >
                    {number}
                  </Link>
                ) : (
                  <span className="font-medium">{number}</span>
                )}
                <StatusBadge variant={documentStatusTone(document.status)}>
                  {humanizeEnum(document.status)}
                </StatusBadge>
                <span className="text-muted-foreground text-xs">
                  {relationshipLabel(document.relationship)}
                </span>
                {document.document_date ? (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {formatDate(document.document_date)}
                  </span>
                ) : null}
                {document.quantity_summary ? (
                  <span className="text-muted-foreground text-xs">
                    {formatQuantitySummary(document.quantity_summary)}
                  </span>
                ) : null}
                {document.amount_summary ? (
                  <span className="text-muted-foreground text-xs">
                    {formatFixedDecimal(document.amount_summary)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
