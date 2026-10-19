import Link from "next/link";
import type { ReactNode } from "react";

type SectionTitleProps = {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  as?: "h1" | "h2";
};

export function SectionTitle({ title, description, action, as = "h2" }: SectionTitleProps) {
  const Heading = as;
  return (
    <div className="section-head">
      <div>
        <Heading>{title}</Heading>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="inline-link">
          {action.label}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}

export function PageHead({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="shell">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </header>
  );
}
