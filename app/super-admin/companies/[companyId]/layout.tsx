import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";

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
    select: { name: true },
  });

  if (!company) notFound();

  return (
    <div>
      {/* Not dismissible by design — prevents accidental cross-tenant confusion while super admin
          is viewing a single company's normally-session-scoped data through a shared login. */}
      <div className="flex items-center justify-center gap-3 bg-[var(--elite-warning)] px-4 py-2 text-center text-sm font-medium text-black">
        <span>
          Viewing <strong>{company.name}</strong> as super admin
        </span>
        <Link
          href="/super-admin/companies"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:no-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to all companies
        </Link>
      </div>
      {children}
    </div>
  );
}
