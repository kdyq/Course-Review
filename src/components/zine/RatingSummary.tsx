import { MIN_SAMPLE_SIZE } from "@/lib/constants";
import { hasEnoughSamples } from "@/lib/format";
import { StarRating } from "./StarRating";

type RatingSummaryProps = {
  average: number | null;
  count: number;
  distribution?: number[];
  label?: string;
  minimum?: number;
};

export function RatingSummary({
  average,
  count,
  distribution,
  label = "推荐度",
  minimum = MIN_SAMPLE_SIZE,
}: RatingSummaryProps) {
  if (average === null || !hasEnoughSamples(count, minimum)) {
    return (
      <div className="sample-note">
        样本不足，暂不显示平均分。当前有 {count} 条评价，至少需要 {minimum} 条。
      </div>
    );
  }

  const max = distribution ? Math.max(...distribution, 1) : 1;

  return (
    <div className="stack">
      <div className="row">
        <strong className="rating-average">{average.toFixed(1)}</strong>
        <div className="stack-sm">
          <StarRating value={average} label={label} size={16} />
          <span className="rating-count">{count} 条评价</span>
        </div>
      </div>
      {distribution ? (
        <div className="distribution">
          <span className="sr-only">{label}评分分布</span>
          {[5, 4, 3, 2, 1].map((score) => {
            const value = distribution[score - 1] ?? 0;
            const percent = Math.round((value / max) * 100);
            return (
              <div className="distribution-row" key={score}>
                <span className="mono muted">{score} 星</span>
                <span className="distribution-bar">
                  <span style={{ width: `${percent}%` }} />
                </span>
                <span className="mono muted">{value}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
