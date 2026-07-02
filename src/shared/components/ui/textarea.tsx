import * as React from "react";
import { cn } from "@/shared/utils/cn.util";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    data-slot="textarea"
    className={cn(
      "flex field-sizing-content min-h-16 w-full rounded-xl border border-input bg-card/90 px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-sm outline-none transition placeholder:font-medium placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
