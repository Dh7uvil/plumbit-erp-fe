"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/shared/components/document/document-links";
import {
  SOURCE_DOCUMENT_PICKER_TYPES,
  listSourceDocuments,
} from "@/shared/components/document/source-document-list";
import { MasterSelect } from "@/shared/components/form/master-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function SourceDocumentPicker({
  documentType,
  documentId,
  documentNumber,
  onDocumentTypeChange,
  onDocumentIdChange,
  disabled = false,
  typeLabel = "Document type",
  numberLabel = "Document no.",
}: {
  documentType: string;
  documentId: string;
  documentNumber?: string | null;
  onDocumentTypeChange: (value: DocumentType) => void;
  onDocumentIdChange: (value: string) => void;
  disabled?: boolean;
  typeLabel?: string;
  numberLabel?: string;
}) {
  const [search, setSearch] = useState("");
  const normalizedType = documentType.trim().toUpperCase();
  const listQueryKey = useTenantQueryKey(["source-documents", normalizedType, search]);
  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () => listSourceDocuments(normalizedType, search),
    enabled: Boolean(normalizedType) && normalizedType !== OPTIONAL_SELECT_NONE,
  });

  const options = useMemo(() => {
    const rows = listQuery.data ?? [];
    if (
      documentId &&
      documentId !== OPTIONAL_SELECT_NONE &&
      !rows.some((row) => row.id === documentId)
    ) {
      const label = documentNumber?.trim() || documentId.slice(0, 8);
      return [{ id: documentId, label }, ...rows];
    }
    return rows;
  }, [documentId, documentNumber, listQuery.data]);

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium leading-none">{typeLabel}</span>
        <Select
          value={normalizedType || OPTIONAL_SELECT_NONE}
          onValueChange={(value) => {
            onDocumentTypeChange(value as DocumentType);
            onDocumentIdChange(OPTIONAL_SELECT_NONE);
            setSearch("");
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OPTIONAL_SELECT_NONE}>Select type</SelectItem>
            {SOURCE_DOCUMENT_PICKER_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium leading-none">{numberLabel}</span>
        <MasterSelect
          value={documentId || OPTIONAL_SELECT_NONE}
          onValueChange={onDocumentIdChange}
          disabled={disabled || !normalizedType || normalizedType === OPTIONAL_SELECT_NONE}
          placeholder="Select document"
          searchPlaceholder="Search document no…"
          emptyText="No matching documents"
          loading={listQuery.isFetching}
          onQueryChange={setSearch}
          options={[
            { value: OPTIONAL_SELECT_NONE, label: "Select document" },
            ...options.map((row) => ({ value: row.id, label: row.label })),
          ]}
        />
      </div>
    </>
  );
}
