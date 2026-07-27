import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

// Ollama: text-input pill, soft surface fill, hairline border on focus.
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex w-full rounded-2xl border border-[#E7DDF8] bg-white px-4 py-3 text-sm text-[#4A3A72] placeholder:text-[#4A3A72]/35 focus-visible:outline-none focus-visible:border-[#8F7BD6] focus-visible:ring-0 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
