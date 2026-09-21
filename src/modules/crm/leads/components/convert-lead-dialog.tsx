"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TAX_TREATMENT_LABELS, TAX_TREATMENTS } from "@/modules/crm/customers/schemas";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useConvertLead } from "@/modules/crm/leads/mutations";
import { leadDisplayName, type Lead } from "@/modules/crm/leads/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type CustomerMode = "existing" | "new";

export function ConvertLeadDialog({
  lead,
  open,
  onOpenChange,
  onConverted,
}: {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted: (opportunityId: string | null) => void;
}) {
  const convertLead = useConvertLead();
  const customersQuery = useAllCustomers(open);
  const customers = customersQuery.data ?? [];
  const [customerMode, setCustomerMode] = useState<CustomerMode>("new");
  const [customerId, setCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [taxTreatment, setTaxTreatment] = useState<(typeof TAX_TREATMENTS)[number]>("UNREGISTERED");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityName, setOpportunityName] = useState("");

  const defaultCustomerName = useMemo(
    () => lead.company_name?.trim() || leadDisplayName(lead),
    [lead],
  );
  const defaultContactName = useMemo(() => {
    const parts = [lead.first_name, lead.last_name].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }
    return defaultCustomerName;
  }, [defaultCustomerName, lead.first_name, lead.last_name]);
  const defaultOpportunityName = useMemo(
    () => lead.company_name?.trim() || defaultContactName,
    [defaultContactName, lead.company_name],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setCustomerMode("new");
    setCustomerId("");
    setNewCustomerName(defaultCustomerName);
    setTaxTreatment("UNREGISTERED");
    setContactName(defaultContactName);
    setContactEmail(lead.email ?? "");
    setContactPhone(lead.phone ?? "");
    setCreateOpportunity(true);
    setOpportunityName(defaultOpportunityName);
  }, [
    defaultContactName,
    defaultCustomerName,
    defaultOpportunityName,
    lead.email,
    lead.phone,
    open,
  ]);

  async function onSubmit() {
    if (customerMode === "existing" && !customerId) {
      toast.error("Select a customer");
      return;
    }
    if (customerMode === "new" && !newCustomerName.trim()) {
      toast.error("Enter a customer name");
      return;
    }
    if (!contactName.trim()) {
      toast.error("Enter a contact name");
      return;
    }
    try {
      const result = await convertLead.mutateAsync({
        id: lead.id,
        version: lead.version,
        ...(customerMode === "existing"
          ? { customer_id: customerId }
          : {
              new_customer: {
                name: newCustomerName.trim(),
                tax_treatment: taxTreatment,
              },
            }),
        contact: {
          name: contactName.trim(),
          email: contactEmail.trim() || null,
          phone: contactPhone.trim() || null,
          is_primary: true,
        },
        opportunity: {
          create: createOpportunity,
          name: createOpportunity ? opportunityName.trim() || defaultOpportunityName : null,
        },
      });
      toast.success("Lead converted");
      onOpenChange(false);
      onConverted(result.opportunity_id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert lead</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Customer</Label>
            <Select
              value={customerMode}
              onValueChange={(value) => setCustomerMode(value as CustomerMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Create new customer</SelectItem>
                <SelectItem value="existing">Link existing customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {customerMode === "existing" ? (
            <div className="grid gap-2">
              <Label>Existing customer</Label>
              <MasterSelect
                value={customerId}
                onValueChange={setCustomerId}
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                }))}
                placeholder="Select customer"
                aria-label="Existing customer"
              />
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="convert-customer-name">Customer name</Label>
                <Input
                  id="convert-customer-name"
                  value={newCustomerName}
                  onChange={(event) => setNewCustomerName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tax treatment</Label>
                <Select
                  value={taxTreatment}
                  onValueChange={(value) =>
                    setTaxTreatment(value as (typeof TAX_TREATMENTS)[number])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_TREATMENTS.map((treatment) => (
                      <SelectItem key={treatment} value={treatment}>
                        {TAX_TREATMENT_LABELS[treatment]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="convert-contact-name">Contact name</Label>
            <Input
              id="convert-contact-name"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="convert-contact-email">Email</Label>
              <Input
                id="convert-contact-email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="convert-contact-phone">Phone</Label>
              <Input
                id="convert-contact-phone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="convert-create-opportunity"
              checked={createOpportunity}
              onCheckedChange={(checked) => setCreateOpportunity(checked === true)}
            />
            <Label htmlFor="convert-create-opportunity">Create opportunity</Label>
          </div>
          {createOpportunity ? (
            <div className="grid gap-2">
              <Label htmlFor="convert-opportunity-name">Opportunity name</Label>
              <Input
                id="convert-opportunity-name"
                value={opportunityName}
                onChange={(event) => setOpportunityName(event.target.value)}
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={convertLead.isPending} onClick={() => void onSubmit()}>
            {convertLead.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Convert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
