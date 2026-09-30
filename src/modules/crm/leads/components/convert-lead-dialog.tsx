"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { usePartyContacts } from "@/modules/crm/contacts/queries";
import { TAX_TREATMENT_LABELS, TAX_TREATMENTS } from "@/modules/crm/customers/schemas";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useConvertLead } from "@/modules/crm/leads/mutations";
import { leadDisplayName, type Lead } from "@/modules/crm/leads/schemas";
import { useAllPipelines, usePipeline } from "@/modules/crm/pipelines/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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
type ContactMode = "existing" | "new";

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
  const pipelinesQuery = useAllPipelines(open);
  const pipelines = pipelinesQuery.data ?? [];
  const currenciesQuery = useAllCurrencies(open);
  const currencies = currenciesQuery.data ?? [];

  const [customerMode, setCustomerMode] = useState<CustomerMode>("new");
  const [customerId, setCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [taxTreatment, setTaxTreatment] = useState<(typeof TAX_TREATMENTS)[number]>("UNREGISTERED");
  const [trn, setTrn] = useState("");
  const [contactMode, setContactMode] = useState<ContactMode>("new");
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityName, setOpportunityName] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [stageId, setStageId] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  const resolvedCustomerId = customerMode === "existing" ? customerId : null;
  const partyContactsQuery = usePartyContacts(resolvedCustomerId, open && customerMode === "existing");
  const partyContacts = partyContactsQuery.data ?? [];
  const pipelineQuery = usePipeline(pipelineId || null);
  const openStages = useMemo(
    () => (pipelineQuery.data?.stages ?? []).filter((stage) => stage.stage_kind === "OPEN"),
    [pipelineQuery.data?.stages],
  );

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
  const duplicateCustomer = useMemo(() => {
    const candidate = newCustomerName.trim().toLowerCase();
    if (!candidate) {
      return null;
    }
    return customers.find((customer) => customer.name.trim().toLowerCase() === candidate) ?? null;
  }, [customers, newCustomerName]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCustomerMode("new");
    setCustomerId("");
    setNewCustomerName(defaultCustomerName);
    setTaxTreatment("UNREGISTERED");
    setTrn("");
    setContactMode("new");
    setContactId("");
    setContactName(defaultContactName);
    setContactEmail(lead.email ?? "");
    setContactPhone(lead.phone ?? "");
    setCreateOpportunity(true);
    setOpportunityName(defaultOpportunityName);
    setPipelineId("");
    setStageId("");
    setAmount(lead.estimated_value ?? "");
    setCurrencyId(lead.currency_id ?? "");
    setExpectedCloseDate("");
  }, [
    defaultContactName,
    defaultCustomerName,
    defaultOpportunityName,
    lead.currency_id,
    lead.email,
    lead.estimated_value,
    lead.phone,
    open,
  ]);

  useEffect(() => {
    if (!pipelineId && pipelines.length > 0) {
      const defaultPipeline = pipelines.find((pipeline) => pipeline.is_default) ?? pipelines[0];
      setPipelineId(defaultPipeline.id);
    }
  }, [pipelineId, pipelines]);

  useEffect(() => {
    if (!stageId && openStages.length > 0) {
      setStageId(openStages[0]?.id ?? "");
    }
  }, [openStages, stageId]);

  useEffect(() => {
    if (customerMode === "existing") {
      setContactMode(partyContacts.length > 0 ? "existing" : "new");
    } else {
      setContactMode("new");
      setContactId("");
    }
  }, [customerMode, partyContacts.length]);

  async function onSubmit() {
    if (customerMode === "existing" && !customerId) {
      toast.error("Select a customer");
      return;
    }
    if (customerMode === "new" && !newCustomerName.trim()) {
      toast.error("Enter a customer name");
      return;
    }
    if (customerMode === "new" && taxTreatment === "REGISTERED" && !trn.trim()) {
      toast.error("Enter a TRN for registered customers");
      return;
    }
    if (customerMode === "new" && trn.trim() && !/^\d{15}$/.test(trn.trim())) {
      toast.error("TRN must be exactly 15 digits");
      return;
    }
    if (contactMode === "existing" && !contactId) {
      toast.error("Select a contact");
      return;
    }
    if (contactMode === "new" && !contactName.trim()) {
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
                trn: trn.trim() || null,
              },
            }),
        ...(contactMode === "existing"
          ? { contact_id: contactId }
          : {
              contact: {
                name: contactName.trim(),
                email: contactEmail.trim() || null,
                phone: contactPhone.trim() || null,
                is_primary: true,
              },
            }),
        opportunity: {
          create: createOpportunity,
          name: createOpportunity ? opportunityName.trim() || defaultOpportunityName : null,
          pipeline_id: createOpportunity && pipelineId ? pipelineId : null,
          stage_id: createOpportunity && stageId ? stageId : null,
          amount: createOpportunity && amount.trim() ? amount.trim() : null,
          currency_id: createOpportunity && currencyId ? currencyId : null,
          expected_close_date:
            createOpportunity && expectedCloseDate.trim() ? expectedCloseDate.trim() : null,
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
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
              {duplicateCustomer ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    A customer named &quot;{duplicateCustomer.name}&quot; already exists. Consider
                    linking the existing customer instead.
                  </AlertDescription>
                </Alert>
              ) : null}
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
              <div className="grid gap-2">
                <Label htmlFor="convert-trn">TRN</Label>
                <Input
                  id="convert-trn"
                  value={trn}
                  onChange={(event) => setTrn(event.target.value.replace(/\D/g, "").slice(0, 15))}
                  inputMode="numeric"
                  placeholder="15-digit TRN"
                />
              </div>
            </div>
          )}
          {customerMode === "existing" && partyContacts.length > 0 ? (
            <div className="grid gap-2">
              <Label>Contact</Label>
              <Select
                value={contactMode}
                onValueChange={(value) => setContactMode(value as ContactMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Use existing contact</SelectItem>
                  <SelectItem value="new">Create new contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {contactMode === "existing" ? (
            <div className="grid gap-2">
              <Label>Existing contact</Label>
              <MasterSelect
                value={contactId}
                onValueChange={setContactId}
                options={partyContacts.map((contact) => ({
                  value: contact.id,
                  label: contact.email ? `${contact.name} (${contact.email})` : contact.name,
                }))}
                placeholder="Select contact"
                aria-label="Existing contact"
              />
            </div>
          ) : (
            <>
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
            </>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="convert-create-opportunity"
              checked={createOpportunity}
              onCheckedChange={(checked) => setCreateOpportunity(checked === true)}
            />
            <Label htmlFor="convert-create-opportunity">Create opportunity</Label>
          </div>
          {createOpportunity ? (
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="convert-opportunity-name">Opportunity name</Label>
                <Input
                  id="convert-opportunity-name"
                  value={opportunityName}
                  onChange={(event) => setOpportunityName(event.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Pipeline</Label>
                  <MasterSelect
                    value={pipelineId}
                    onValueChange={(value) => {
                      setPipelineId(value);
                      setStageId("");
                    }}
                    options={pipelines.map((pipeline) => ({
                      value: pipeline.id,
                      label: pipeline.name,
                    }))}
                    placeholder="Select pipeline"
                    aria-label="Pipeline"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Stage</Label>
                  <MasterSelect
                    value={stageId}
                    onValueChange={setStageId}
                    options={openStages.map((stage) => ({
                      value: stage.id,
                      label: stage.name,
                    }))}
                    placeholder="Select stage"
                    aria-label="Stage"
                    disabled={!pipelineId}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="convert-amount">Amount</Label>
                  <Input
                    id="convert-amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <MasterSelect
                    value={currencyId}
                    onValueChange={setCurrencyId}
                    options={currencies.map((currency) => ({
                      value: currency.id,
                      label: currency.code,
                    }))}
                    placeholder="Select currency"
                    aria-label="Currency"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="convert-expected-close">Expected close date</Label>
                <Input
                  id="convert-expected-close"
                  type="date"
                  value={expectedCloseDate}
                  onChange={(event) => setExpectedCloseDate(event.target.value)}
                />
              </div>
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
