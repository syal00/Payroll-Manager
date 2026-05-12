import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-code">404</div>
      <h1 className="error-title">Page not found</h1>
      <p className="error-desc">
        The page you&rsquo;re looking for has been moved, deleted, or never existed. Let&rsquo;s get you back on track.
      </p>
      <Link href="/" className="landing-primary-cta">
        Go Home
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
  );
}
