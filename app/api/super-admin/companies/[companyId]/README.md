# Super-admin company drill-down API routes

Every file under `app/api/super-admin/companies/[companyId]/` **must**:

1. Start with the lint comment: `companyId MUST come from params, not session`
2. Guard with `requireSuperAdminCompanyDrilldown()` from `lib/super-admin-drilldown.ts`
3. Scope every query with `scopeForCompanyDrilldown()` / `timesheetWhereForCompanyDrilldown()` /
   `payslipWhereForCompanyDrilldown()` from `lib/manager-scope.ts` — never plain `scopeFor()`

Super admin sessions have `companyId: null`. Using session scoping mixes all tenants' rows.

Cross-company aggregates (counts only, no row data) belong on `GET /api/super-admin/companies` only.
