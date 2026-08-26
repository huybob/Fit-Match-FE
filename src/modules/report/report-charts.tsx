"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartRow {
  key: string;
  label: string;
  value: number;
}

/**
 * Biểu đồ cột NGANG cho màn Báo cáo vận hành.
 *
 * <p>Ngang chứ không dọc vì nhãn ở đây là chữ tiếng Việt có dấu ("Chờ thanh
 * toán", "Đã hoàn tiền") — trục dọc sẽ phải xoay chữ hoặc cắt cụt.
 *
 * <p>Một series một màu: mỗi biểu đồ trả lời đúng một câu hỏi về ĐỘ LỚN, còn
 * danh tính từng cột đã nằm ở nhãn trục. Tô mỗi cột một màu ở đây là mã hoá màu
 * cho thứ không cần mã hoá, và tạo ra một bảng màu phải đi kiểm tra mù màu.
 *
 * <p>Màu lấy thẳng từ token `--primary` nên tự đổi theo sáng/tối, không phải
 * hardcode hai bảng màu rồi lệch nhau khi ai đó chỉnh design token.
 */
export function ReportBarChart({
  title,
  data,
  format,
}: {
  title: string;
  data: ChartRow[];
  /** Đổi số sang chuỗi hiển thị (mặc định để nguyên) — dùng cho cột tiền. */
  format?: (value: number) => string;
}) {
  const t = useTranslations();
  const rows = data.filter((d) => Number.isFinite(d.value));
  if (!rows.length) return null;

  /*
   * Recharts gõ tham số của formatter là `ValueType | undefined` (ô rỗng, chuỗi,
   * mảng cho stack). Nhận rộng rồi tự thu hẹp ngay tại đây thay vì ép kiểu ở
   * từng chỗ gọi: ép kiểu là hứa với TypeScript một điều thư viện không hứa.
   */
  const show = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return "—";
    return format ? format(n) : String(n);
  };
  // Cột cao 26px + khoảng thở: chiều cao khung phải theo SỐ CỘT, nếu cố định thì
  // báo cáo 3 trạng thái bị kéo dãn còn 7 trạng thái thì chồng chữ lên nhau.
  const height = Math.max(140, rows.length * 42 + 32);

  return (
    <figure className="rounded-2xl border border-border bg-card p-5">
      <figcaption className="mb-3 text-sm font-black">{title}</figcaption>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 64, bottom: 4, left: 4 }}
          barCategoryGap="22%"
        >
          {/* Lưới chỉ theo trục giá trị và mờ hẳn: nó là thước đo nền, không phải
              nội dung. Lưới ngang ở biểu đồ cột ngang chỉ cắt ngang chính cột. */}
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickFormatter={show}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            formatter={(value) => [show(value), t("common.table.value")]}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 700 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26} fill="var(--primary)">
            {rows.map((row) => (
              <Cell key={row.key} />
            ))}
            {/* Nhãn giá trị ngay đầu cột: người đọc báo cáo tài chính luôn cần con
                số chính xác, biểu đồ chỉ thêm phần so sánh nhanh. Đây cũng là lớp
                mã hoá thứ hai bên cạnh màu. */}
            <LabelList
              dataKey="value"
              position="right"
              formatter={show}
              style={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
