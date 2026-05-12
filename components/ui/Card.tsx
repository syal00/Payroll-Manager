import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={`card ${padding ? "" : "!p-0"} ${className}`.trim()}>{children}</div>
  );
}
