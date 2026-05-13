const variants: Record<string, string> = {
  default: "design-badge design-badge-neutral badge-text",
  success: "design-badge design-badge-success badge-text",
  warning: "design-badge design-badge-warning badge-text",
  danger: "design-badge design-badge-danger badge-text",
  info: "design-badge design-badge-info badge-text",
  navy: "design-badge design-badge-violet badge-text",
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
