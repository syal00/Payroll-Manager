import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Globe } from "lucide-react";
import { CompanyDrilldownNav } from "@/components/super-admin/CompanyDrilldownNav";
import { TenantActingCookie } from "@/components/super-admin/TenantActingCookie";
import { formatCompanySubdomain } from "@/lib/company-subdomain-display";

export default async function CompanyDrilldownLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, slug: true, websiteUrl: true, logoUrl: true },
  });

  if (!company) notFound();

  return (
    <div>
      <TenantActingCookie companyId={companyId} />
      <div className="sa-platform-bar">
        <Link
          href="/super-admin/companies"
          className="inline-flex items-center gap-1 hover:text-[var(--sa-heading)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All companies
        </Link>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-2">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt=""
              width={24}
              height={24}
              className="rounded-md object-contain"
            />
          ) : null}
          Inspecting <strong>{company.name}</strong>
        </span>
        {company.websiteUrl ? (
          <>
            <span aria-hidden>·</span>
            <a
              href={company.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--sa-accent)] hover:underline"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden />
              Website
            </a>
          </>
        ) : null}
        <span aria-hidden>·</span>
        <code className="sa-mono text-[var(--sa-accent)]">{formatCompanySubdomain(company.slug, company.websiteUrl)}</code>
      </div>
      <div className="page-container !pb-0">
        <CompanyDrilldownNav companyId={companyId} />
      </div>
      {children}
    </div>
  );
}
