"use client";

import type { ReactNode } from "react";

import type { Contact } from "@/modules/crm/contacts/schemas";
import {
  auditActorColumns,
  auditTimestampColumns,
} from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  omitColumnIds,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { Badge } from "@/shared/components/ui/badge";

export function contactColumnDefs({
  companyById,
  userNameById,
  actions,
  omit = [],
}: {
  companyById?: Map<string, { name: string; href: string }>;
  userNameById: Map<string, string>;
  actions?: (contact: Contact) => ReactNode;
  omit?: readonly string[];
}): Array<DataTableColumn<Contact>> {
  return omitColumnIds(
    [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (contact) => <RecordLink href={`/contacts/${contact.id}`}>{contact.name}</RecordLink>,
      },
      {
        id: "company",
        header: "Company",
        cell: (contact) => {
          const company = companyById?.get(contact.customer_id);
          return company ? <RecordLink href={company.href}>{company.name}</RecordLink> : "—";
        },
      },
      {
        id: "email",
        header: "Email",
        sortableField: "email",
        cell: (contact) => contact.email || "—",
      },
      {
        id: "phone",
        header: "Phone",
        cell: (contact) => contact.phone || "—",
      },
      {
        id: "is_primary",
        header: "Primary",
        sortableField: "is_primary",
        cell: (contact) => (contact.is_primary ? <Badge variant="info">Primary</Badge> : "—"),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "is_active",
        cell: (contact) => <ActiveBadge active={contact.is_active} />,
      },
      ...auditTimestampColumns<Contact>(),
      ...auditActorColumns<Contact>(userNameById),
      ...actionsColumn<Contact>(Boolean(actions), (contact) => actions?.(contact)),
    ],
    omit,
  );
}
