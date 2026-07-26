"use client";

import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast flex items-start gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl text-sm font-semibold text-foreground",
          description: "text-muted-foreground font-medium",
          actionButton: "bg-primary text-primary-foreground text-xs font-black px-3 py-1.5 rounded-lg",
          cancelButton: "bg-muted text-muted-foreground text-xs font-semibold px-3 py-1.5 rounded-lg",
          error: "border-destructive/30",
          success: "border-success/30",
          warning: "border-warning/30",
          info: "border-primary/20",
          closeButton: "bg-muted text-muted-foreground hover:bg-border rounded-full",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
