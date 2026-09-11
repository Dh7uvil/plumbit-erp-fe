"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useCan } from "@/shared/providers/session-provider";

export type PartyDocumentLink = {
  href: string;
  label: string;
  permission: string;
};

export function PartyDocumentsCard({
  title,
  links,
}: {
  title: string;
  links: readonly PartyDocumentLink[];
}) {
  const can = useCan();
  const visible = links.filter((link) => can(link.permission));
  if (visible.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {visible.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm underline-offset-4 hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
