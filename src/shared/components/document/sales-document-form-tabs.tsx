"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

type SalesDocumentFormTabsProps = {
  documentPanel: ReactNode;
  additionalDetailsPanel: ReactNode;
  defaultTab?: "document" | "additional";
};

export function SalesDocumentFormTabs({
  documentPanel,
  additionalDetailsPanel,
  defaultTab = "document",
}: SalesDocumentFormTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="gap-4">
      <TabsList>
        <TabsTrigger value="document">Document</TabsTrigger>
        <TabsTrigger value="additional">Additional details</TabsTrigger>
      </TabsList>
      <TabsContent value="document" className="mt-0 flex flex-col gap-5">
        {documentPanel}
      </TabsContent>
      <TabsContent value="additional" className="mt-0">
        <div
          data-slot="form-grid"
          className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {additionalDetailsPanel}
        </div>
      </TabsContent>
    </Tabs>
  );
}
