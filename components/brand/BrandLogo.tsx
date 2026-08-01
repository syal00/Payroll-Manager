import Image from "next/image";
import Link from "next/link";
import { DEFAULT_BRAND_NAME } from "@/lib/brand";
import { TenantLogoImage } from "@/components/brand/TenantLogoImage";

export const BRAND_LOGO_PATH = "/logo.png";

const DEFAULT_BRAND = DEFAULT_BRAND_NAME;

type BrandLogoProps = {
  size?: number;
  showText?: boolean;
  showTag?: boolean;
  nameLine1?: string;
  nameLine2?: string;
  /** Tenant-supplied logo URL (e.g. from Company.logoUrl). Falls back to the bundled brand mark. */
  logoSrc?: string | null;
  href?: string | null;
  priority?: boolean;
  wrapperClassName?: string;
  imageClassName?: string;
  textWrapperClassName?: string;
  nameClassName?: string;
  tagClassName?: string;
  testId?: string;
};

function parseBrandName(full: string) {
  const parts = full.split(" ").filter(Boolean);
  if (parts.length <= 2) return { line1: full, line2: "" };
  return { line1: parts.slice(0, 2).join(" "), line2: parts.slice(2).join(" ") || "Group" };
}

export function BrandLogo({
  size = 40,
  showText = true,
  showTag = true,
  nameLine1,
  nameLine2,
  logoSrc,
  href = null,
  priority = false,
  wrapperClassName = "brand-logo",
  imageClassName = "brand-logo-img",
  textWrapperClassName = "brand-logo-text",
  nameClassName = "brand-logo-name",
  tagClassName = "brand-logo-tag",
  testId,
}: BrandLogoProps) {
  const brand = process.env.NEXT_PUBLIC_COMPANY_NAME ?? DEFAULT_BRAND;
  const parsed = parseBrandName(brand);
  const line1 = nameLine1 ?? parsed.line1;
  const line2 = nameLine2 ?? parsed.line2;

  const content = (
    <>
      {logoSrc ? (
        <TenantLogoImage
          src={logoSrc}
          alt={`${brand} logo`}
          size={size}
          className={imageClassName}
        />
      ) : (
        <Image
          src={BRAND_LOGO_PATH}
          alt={`${brand} logo`}
          width={size}
          height={size}
          className={imageClassName}
          priority={priority}
          style={{ width: size, height: "auto" }}
        />
      )}
      {showText ? (
        <span className={textWrapperClassName}>
          <span className={nameClassName}>{line1}</span>
          {showTag && line2 ? <span className={tagClassName}>{line2}</span> : null}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={wrapperClassName} data-testid={testId}>
        {content}
      </Link>
    );
  }

  return (
    <div className={wrapperClassName} data-testid={testId}>
      {content}
    </div>
  );
}
