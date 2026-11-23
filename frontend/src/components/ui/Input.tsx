import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@utils/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  bare?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, bare, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-transparent font-sans text-sm font-medium tracking-[-0.01em] text-fg outline-none placeholder:font-normal placeholder:text-fg-muted",
        bare
          ? "border-0 p-0 shadow-none"
          : "rounded-sm border border-line px-3.5 py-3 transition-[border-color,box-shadow] focus:border-fg focus:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
