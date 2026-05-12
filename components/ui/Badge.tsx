const variants: Record<string, string> = {
  default: "design-badge design-badge-neutral",
  success: "design-badge design-badge-success",
  warning: "design-badge design-badge-warning",
  danger: "design-badge design-badge-danger",
  info: "design-badge design-badge-info",
  navy: "design-badge design-badge-violet",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return <span className={variants[variant] ?? variants.default}>{children}</span>;
}
