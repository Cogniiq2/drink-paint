import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";

interface BaseProps {
  variant?: Variant;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonProps = BaseProps & Omit<ComponentProps<"button">, "className" | "children">;
type LinkProps = BaseProps & { href: string } & Omit<ComponentProps<typeof Link>, "className" | "children" | "href">;

const cls = (variant: Variant, className?: string) => ["btn", `btn-${variant}`, className].filter(Boolean).join(" ");

function Inner({ children, arrow, variant }: { children: ReactNode; arrow?: boolean; variant: Variant }) {
  return (
    <>
      <span>{children}</span>
      {arrow && (
        <span className="btn-arrow" aria-hidden="true">
          →
        </span>
      )}
      {variant === "ghost" && <span className="btn-underline" aria-hidden="true" />}
    </>
  );
}

export function Button({ variant = "primary", arrow, className, children, ...rest }: ButtonProps) {
  return (
    <button className={cls(variant, className)} {...rest}>
      <Inner arrow={arrow} variant={variant}>
        {children}
      </Inner>
    </button>
  );
}

export function ButtonLink({ variant = "primary", arrow, className, children, href, ...rest }: LinkProps) {
  return (
    <Link href={href} className={cls(variant, className)} {...rest}>
      <Inner arrow={arrow} variant={variant}>
        {children}
      </Inner>
    </Link>
  );
}
