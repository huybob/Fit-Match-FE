"use client";

/**
 * Biểu đồ cột ngang cho màn Báo cáo vận hành.
 *
 * <p>Tự vẽ bằng div thay vì kéo thêm thư viện chart: dữ liệu báo cáo là vài con
 * số tổng hợp (vé theo trạng thái, dòng tiền, tranh chấp theo trạng thái), không
 * phải chuỗi thời gian — một thư viện vẽ đồ thị cho ngần ấy cột là đổi lấy vài
 * trăm KB bundle và một phụ thuộc phải bảo trì.
 *
 * <p>Cột ngang chứ không phải cột dọc vì nhãn ở đây là chữ tiếng Việt có dấu
 * ("Chờ thanh toán", "Đã hoàn tiền") — nhãn dọc sẽ bị xoay hoặc cắt.
 *
 * <p>Con số vẫn in nguyên bên phải mỗi cột: biểu đồ để so sánh nhanh, còn giá
 * trị chính xác thì người đọc báo cáo tài chính luôn cần.
 */
export function ReportBarChart({
  title,
  data,
  format,
}: {
  title: string;
  data: Array<{ key: string; label: string; value: number }>;
  /** Đổi số sang chuỗi hiển thị (mặc định để nguyên) — dùng cho cột tiền. */
  format?: (value: number) => string;
}) {
  const rows = data.filter((d) => Number.isFinite(d.value));
  if (!rows.length) return null;

  // Chia theo giá trị LỚN NHẤT chứ không phải tổng: khi một trạng thái áp đảo,
  // chia theo tổng làm mọi cột còn lại dẹp thành một vạch không đọc được.
  const max = Math.max(...rows.map((r) => r.value), 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      <ul className="space-y-2.5">
        {rows.map((row) => {
          // max = 0 (chưa có dữ liệu) thì mọi cột về 0 thay vì chia cho 0.
          const percent = max > 0 ? Math.round((row.value / max) * 100) : 0;
          return (
            <li key={row.key} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
              <span className="truncate text-xs font-semibold text-muted-foreground">
                {row.label}
              </span>
              <span
                className="h-2.5 rounded-full bg-muted"
                role="img"
                aria-label={`${row.label}: ${format ? format(row.value) : row.value}`}
              >
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="text-right text-xs font-bold tabular-nums">
                {format ? format(row.value) : row.value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
