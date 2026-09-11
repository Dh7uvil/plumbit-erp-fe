"use client";

import Link from "next/link";

import {
  documentDetailHref,
  documentTypeDisplayLabel,
} from "@/shared/components/document/document-links";
import type { RelatedDocumentRef } from "@/shared/components/document/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDate } from "@/shared/lib/format";

const RELATIONSHIP_LABELS: Record<string, string> = {
  source: "Source",
  child: "Created from this document",
};

function relationshipLabel(value: string): string {
  return RELATIONSHIP_LABELS[value] ?? value.replace(/_/g, " ");
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
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm"
              >
                <span className="text-muted-foreground">{typeLabel}</span>
                {href ? (
                  <Link href={href} className="text-foreground underline-offset-4 hover:underline">
                    {number}
                  </Link>
                ) : (
                  <span>{number}</span>
                )}
                <span className="text-muted-foreground">{document.status.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">
                  {relationshipLabel(document.relationship)}
                </span>
                {document.document_date ? (
                  <span className="text-muted-foreground">{formatDate(document.document_date)}</span>
                ) : null}
                {document.quantity_summary ? (
                  <span className="text-muted-foreground">{document.quantity_summary}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
