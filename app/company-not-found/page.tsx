import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function CompanyNotFoundPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;

  return (
    <div className="error-page">
      <div className="error-code">404</div>
      <h1 className="error-title">Workspace not found</h1>
      <p className="error-desc">
        {slug
          ? `We couldn't find a company workspace at "${slug}". Check the link your administrator sent you, or contact them for the correct address.`
          : "We couldn't find a company workspace at this address. Check the link your administrator sent you, or contact them for the correct address."}
      </p>
      <Link href="/" className="landing-primary-cta">
        Go Home
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
  );
}
