import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@utils/cn";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-white border border-ink hover:bg-ink-hover active:opacity-90",
  secondary:
    "bg-white text-fg border border-line-strong hover:bg-hover hover:border-[#cfcfd4] active:bg-muted",
  ghost:
    "bg-transparent text-fg-secondary border-transparent hover:text-fg",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-4 text-[13px] font-semibold tracking-[-0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
