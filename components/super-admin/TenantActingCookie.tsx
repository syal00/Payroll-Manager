"use client";

import { useEffect } from "react";
import { TENANT_ACTING_COOKIE } from "@/lib/tenant-acting-constants";

function setTenantCookie(companyId: string) {
  document.cookie = `${TENANT_ACTING_COOKIE}=${encodeURIComponent(companyId)}; path=/; SameSite=Lax`;
}

export function clearTenantActingCookie() {
  document.cookie = `${TENANT_ACTING_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/** Keeps the tenant-acting cookie in sync while super admin inspects a company. */
export function TenantActingCookie({ companyId }: { companyId: string }) {
  useEffect(() => {
    setTenantCookie(companyId);
  }, [companyId]);

  return null;
}

/** Clears tenant context when returning to the all-companies list. */
export function ClearTenantActingCookie() {
  useEffect(() => {
    clearTenantActingCookie();
  }, []);

  return null;
}
