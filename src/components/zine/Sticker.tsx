import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type StickerProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "butter" | "mint" | "sky" | "pink" | "coral";
  children: ReactNode;
};

export function Sticker({ tone = "butter", className, children, ...props }: StickerProps) {
  return (
    <span className={clsx("sticker", `sticker--${tone}`, className)} {...props}>
      {children}
    </span>
  );
}
