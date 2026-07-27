import * as React from "react";
import { cn } from "@/shared/utils/cn.util";

/**
 * Tiêu đề một khối nội dung trong trang — bậc dưới PageHeader.
 * Dùng để chia form dài thành từng phần có ngữ nghĩa rõ ràng.
 */
export function SectionTitle({
  title,
  description,
  icon,
  action,
  as: Heading = "h2",
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  as?: "h2" | "h3" | "h4";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Heading className="flex items-center gap-2 text-base font-black tracking-tight text-foreground">
          {icon ? <span className="text-primary">{icon}</span> : null}
          {title}
        </Heading>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * Thẻ bao một nhóm nội dung/field. Spacing và bo góc thống nhất toàn hệ thống
 * để các trang không còn tự phát mỗi nơi một kiểu card.
 */
export function CardSection({
  title,
  description,
  icon,
  action,
  footer,
  children,
  className,
  contentClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      {title ? (
        <header className="border-b border-border px-5 py-4">
          <SectionTitle title={title} description={description} icon={icon} action={action} />
        </header>
      ) : null}
      <div className={cn("p-5", contentClassName)}>{children}</div>
      {footer ? (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

/**
 * Lưới field cho form. Mặc định 1 cột trên mobile, 2 cột từ sm trở lên —
 * tránh việc mỗi trang tự viết một biến thể grid khác nhau.
 */
export function FormGrid({
  columns = 2,
  children,
  className,
}: {
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Cho một field chiếm hết chiều ngang của FormGrid. */
export function FormGridFull({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("sm:col-span-2 lg:col-span-3", className)}>{children}</div>;
}
