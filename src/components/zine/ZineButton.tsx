import clsx from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ZineButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type BaseProps = {
  variant?: ZineButtonVariant;
  size?: "sm" | "md";
  block?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

type LinkProps = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
};

function buttonClass({ variant = "primary", size = "md", block, className }: BaseProps): string {
  return clsx("btn", `btn-${variant}`, size === "sm" && "btn-sm", block && "btn-block", className);
}

export function ZineButton({
  variant,
  size,
  block,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, block, className, children })}
      {...props}
    >
      {children}
    </button>
  );
}

export function ZineLinkButton({
  href,
  variant,
  size,
  block,
  className,
  children,
  target,
  rel,
  ariaLabel,
}: LinkProps) {
  return (
    <Link
      href={href}
      className={buttonClass({ variant, size, block, className, children })}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
