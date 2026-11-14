import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm text-foreground shadow-sm outline-none placeholder:text-[#87928b] hover:border-[#c7d4ca] focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60", className)} {...props} />;
}
