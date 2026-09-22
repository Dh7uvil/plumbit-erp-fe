import { redirect } from "next/navigation";

export default function PurchaseOrdersPage() {
  redirect("/purchases?tab=orders");
}
