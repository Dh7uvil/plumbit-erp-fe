import { CustomerDetailScreen } from "@/modules/crm/customers/components/customer-detail-screen";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={customerPermissions.update}
      notFoundMessage="Customer not found."
    >
      {(id) => <CustomerDetailScreen customerId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
