import type { ButtonHTMLAttributes, ReactNode } from "react";

const base = "btn h-10 px-[18px] focus-visible:outline-none";

const styles = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-violet-soft",
  danger: "btn-danger",
  ghost: "btn-ghost shadow-none hover:shadow-none",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof styles;
}) {
  return (
    <button type={type} className={`${base} ${styles[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
