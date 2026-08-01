"use client";

import { useState } from "react";
import Image from "next/image";
import { BRAND_LOGO_PATH } from "@/components/brand/BrandLogo";

type TenantLogoImageProps = {
  src: string;
  alt: string;
  size: number;
  className?: string;
};

/** Tenant logo with fallback when the URL 404s (e.g. local-only uploads on Vercel). */
export function TenantLogoImage({ src, alt, size, className }: TenantLogoImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Image
        src={BRAND_LOGO_PATH}
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: "auto" }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
