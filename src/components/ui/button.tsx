import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ollama-style: full-pill geometry, single-color CTA system.
// primary = pure black on canvas; secondary = canvas-on-canvas with hairline.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-ink/80",
        outline:
          "border border-ink bg-white text-ink hover:bg-[#f5f5f5]",
        ghost: "text-ink hover:bg-surface-soft",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        link: "text-ink underline-offset-4 hover:underline px-0 h-auto",
        onDark: "bg-canvas text-ink hover:bg-[#f5f5f5]",
      },
      size: {
        default: "h-9 px-5",
        sm: "h-8 px-4 text-xs",
        lg: "h-11 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
