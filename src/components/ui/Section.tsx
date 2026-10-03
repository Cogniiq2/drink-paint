import type { ReactNode } from "react";

type Surface = "ivory" | "bone" | "dark" | "wine";

const surfaceClass: Record<Surface, string> = {
  ivory: "",
  bone: "surface-bone",
  dark: "surface-dark",
  wine: "surface-wine",
};

export function Section({
  children,
  surface = "ivory",
  className = "",
  id,
  size = "default",
  as: Tag = "section",
  labelledBy,
}: {
  children: ReactNode;
  surface?: Surface;
  className?: string;
  id?: string;
  size?: "default" | "sm" | "none";
  as?: "section" | "div" | "article" | "header" | "footer";
  labelledBy?: string;
}) {
  const pad = size === "default" ? "py-section" : size === "sm" ? "py-section-sm" : "";
  return (
    <Tag id={id} aria-labelledby={labelledBy} className={`relative ${surfaceClass[surface]} ${pad} ${className}`}>
      {children}
    </Tag>
  );
}

export function Container({ children, className = "", wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={`container-x mx-auto w-full ${wide ? "max-w-[1680px]" : "max-w-[1440px]"} ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "", as: Tag = "p" }: { children: ReactNode; className?: string; as?: "p" | "span" | "div" }) {
  return <Tag className={`eyebrow ${className}`}>{children}</Tag>;
}
