import { getSession } from "@/lib/session";
import { isMainAdminRole, isSuperAdminRole } from "@/lib/roles";
import { getTenantActingCompanyId } from "@/lib/tenant-acting";
import AdminHistoryPageClient from "./AdminHistoryPageClient";

export default async function AdminHistoryPage() {
  const session = await getSession();
  const isMainAdmin = session
    ? isSuperAdminRole(session.role)
      ? Boolean(await getTenantActingCompanyId())
      : isMainAdminRole(session.role)
    : false;

  return <AdminHistoryPageClient isMainAdmin={isMainAdmin} />;
}
