"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "./input";
import { IconButton } from "./icon-button";
import { cn } from "@/shared/utils/cn.util";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Ẩn nút hiện/ẩn mật khẩu (vd. field chỉ đọc). */
  hideToggle?: boolean;
}

/** Input mật khẩu kèm nút hiện/ẩn có tooltip + aria-pressed. */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, hideToggle = false, disabled, ...props }, ref) => {
    const t = useTranslations();
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn(!hideToggle && "pr-11", className)}
          {...props}
        />
        {hideToggle ? null : (
          <IconButton
            tooltip={visible ? t("common.actions.hidePassword") : t("common.actions.showPassword")}
            aria-pressed={visible}
            disabled={disabled}
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </IconButton>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
