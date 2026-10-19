import clsx from "clsx";
import { REVIEW_STATUS_LABELS } from "@/lib/constants";

const TONES: Record<string, string | undefined> = {
  PUBLISHED: "sticker--mint",
  PENDING: undefined,
  HIDDEN: "sticker--pink",
  DELETED: "sticker--sky",
};

export function ReviewStatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("sticker", TONES[status])}>{REVIEW_STATUS_LABELS[status] ?? status}</span>
  );
}
