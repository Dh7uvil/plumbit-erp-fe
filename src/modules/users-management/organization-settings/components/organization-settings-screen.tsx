"use client";

import { WarehousesPanel } from "@/modules/inventory-management/warehouses/components/warehouses-panel";
import { BranchesPanel } from "@/modules/users-management/branches/components/branches-panel";
import { DepartmentsPanel } from "@/modules/users-management/departments/components/departments-panel";
import { CompanySettingsForm } from "@/modules/users-management/organization-settings/components/company-settings-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export function OrganizationSettingsScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Organization Settings"
        subtitle="Manage company structure, departments, and branches"
      />
      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>
        <TabsContent value="company" className="mt-4">
          <CompanySettingsForm />
        </TabsContent>
        <TabsContent value="branches" className="mt-4">
          <BranchesPanel />
        </TabsContent>
        <TabsContent value="departments" className="mt-4">
          <DepartmentsPanel />
        </TabsContent>
        <TabsContent value="warehouses" className="mt-4">
          <WarehousesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
