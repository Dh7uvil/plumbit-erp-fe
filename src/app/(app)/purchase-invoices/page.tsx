import { redirect } from "next/navigation";

export default function PurchaseInvoicesPage() {
  redirect("/purchases?tab=bills");
}
