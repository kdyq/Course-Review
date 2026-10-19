"use client";

import { Star, StarHalf } from "@phosphor-icons/react";
import clsx from "clsx";
import { useId, useState } from "react";

type DisplayProps = {
  mode?: "display";
  value: number;
  label?: string;
  size?: number;
  className?: string;
};

type InputProps = {
  mode: "input";
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: number;
  name?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
};

export function StarRating(props: DisplayProps | InputProps) {
  if (props.mode === "input") {
    return <RatingInput {...props} />;
  }
  return <RatingDisplay {...props} />;
}

function RatingDisplay({ value, label = "评分", size = 14, className }: DisplayProps) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span
      className={clsx("stars", className)}
      role="img"
      aria-label={`${label} ${value.toFixed(1)} 分，满分 5 分`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        if (rounded >= star) {
          return <Star key={star} size={size} weight="fill" aria-hidden="true" />;
        }
        if (rounded >= star - 0.5) {
          return <StarHalf key={star} size={size} weight="fill" aria-hidden="true" />;
        }
        return <Star key={star} size={size} weight="regular" aria-hidden="true" />;
      })}
    </span>
  );
}

function RatingInput({
  value,
  onChange,
  label,
  size = 26,
  name,
  className,
  disabled = false,
  required = false,
}: InputProps) {
  const generatedName = useId();
  const groupName = name ?? `rating-${generatedName}`;
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div
      className={clsx("rating-input", className)}
      role="radiogroup"
      aria-label={label}
      aria-required={required || undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className="rating-input__label"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <input
            type="radio"
            name={groupName}
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
            disabled={disabled}
            required={required && star === 1}
            className="sr-only"
          />
          <span
            className={clsx("rating-input__star", display >= star && "is-active")}
            aria-hidden="true"
          >
            <Star size={size} weight={display >= star ? "fill" : "regular"} />
          </span>
          <span className="sr-only">{star} 分</span>
        </label>
      ))}
      <span className="rating-input__value" aria-hidden="true">
        {value ? `${value} / 5` : "未评分"}
      </span>
    </div>
  );
}
