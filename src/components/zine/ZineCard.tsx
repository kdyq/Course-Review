import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type ZinePaper = "paper" | "butter" | "mint" | "sky" | "pink";

type CardOptions = {
  paper?: ZinePaper;
  pad?: boolean;
  flat?: boolean;
  tape?: boolean;
  className?: string;
};

export function zineCardClass({
  paper = "paper",
  pad = false,
  flat = false,
  tape = false,
  className,
}: CardOptions = {}): string {
  return clsx(
    "zine-card",
    paper !== "paper" && `zine-card--${paper}`,
    pad && "zine-card--pad",
    flat && "zine-card--flat",
    tape && "tape-top",
    className,
  );
}

type ZineCardProps = HTMLAttributes<HTMLDivElement> &
  CardOptions & {
    children: ReactNode;
  };

export function ZineCard({ paper, pad, flat, tape, className, children, ...props }: ZineCardProps) {
  return (
    <div className={zineCardClass({ paper, pad, flat, tape, className })} {...props}>
      {children}
    </div>
  );
}
