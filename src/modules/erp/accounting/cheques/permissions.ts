export const chequePermissions = {
  read: "accounting.cheque.read",
  create: "accounting.cheque.create",
  update: "accounting.cheque.update",
  delete: "accounting.cheque.delete",
  issue: "accounting.cheque.issue",
  deposit: "accounting.cheque.deposit",
  clear: "accounting.cheque.clear",
  bounce: "accounting.cheque.bounce",
  cancel: "accounting.cheque.cancel",
} as const;
