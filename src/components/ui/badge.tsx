import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "green" | "amber" | "coral";
const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  coral: "bg-accent-soft text-[#a4503b]",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none", tones[tone], className)} {...props} />;
}
