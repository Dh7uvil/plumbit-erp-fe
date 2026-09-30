export function notificationEntityHref(
  entityType: string,
  entityId: string | null,
): string | null {
  if (!entityId) {
    return null;
  }
  switch (entityType) {
    case "task":
      return `/tasks/${entityId}`;
    case "quotation":
      return `/quotations/${entityId}`;
    case "sales_invoice":
      return `/sales-invoices/${entityId}`;
    case "cheque":
      return `/cheques/${entityId}`;
    default:
      return null;
  }
}
