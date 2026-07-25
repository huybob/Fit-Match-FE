"use client";

import Link from "next/link";
import type { GymPublicProfile, PtPublicProfile } from "@/services/marketplace.service";
import { RatingStars } from "@/shared/components/common/rating-stars";
import { Dialog } from "@/shared/components/ui/dialog";

/**
 * UC-010: bảng so sánh side-by-side 2-3 mục đã chọn từ danh sách yêu thích.
 * Dữ liệu lấy từ chính response favorites (đã kèm rating denorm V51) — không gọi thêm API.
 */

function Row({ label, values }: { label: string; values: React.ReactNode[] }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="py-2.5 px-3 text-sm text-foreground align-top">
          {v ?? "—"}
        </td>
      ))}
    </tr>
  );
}

export function CompareGymsDialog({
  open, onClose, gyms,
}: { open: boolean; onClose: () => void; gyms: GymPublicProfile[] }) {
  return (
    <Dialog open={open} title={`So sánh ${gyms.length} phòng gym`} onClose={onClose}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr>
              <th className="w-28" />
              {gyms.map((g) => (
                <th key={g.id} className="px-3 pb-2 text-left text-sm font-bold text-foreground">
                  <Link href={`/gyms/${g.id}`} className="text-primary hover:underline">
                    {g.gymName}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Đánh giá" values={gyms.map((g) => (
              <RatingStars key={g.id} rating={g.averageRating} count={g.reviewCount} />
            ))} />
            <Row label="Khu vực" values={gyms.map((g) =>
              [g.district, g.city].filter(Boolean).join(", ") || null)} />
            <Row label="Địa chỉ" values={gyms.map((g) => g.address ?? null)} />
            <Row label="Điện thoại" values={gyms.map((g) => g.phone ?? null)} />
            <Row label="Xác minh" values={gyms.map((g) => (g.verified ? "✅ Đã xác minh" : "—"))} />
            <Row label="Giới thiệu" values={gyms.map((g) => (
              <span key={g.id} className="line-clamp-3 text-muted-foreground">{g.description ?? "—"}</span>
            ))} />
          </tbody>
        </table>
      </div>
    </Dialog>
  );
}

export function ComparePtsDialog({
  open, onClose, pts,
}: { open: boolean; onClose: () => void; pts: PtPublicProfile[] }) {
  return (
    <Dialog open={open} title={`So sánh ${pts.length} huấn luyện viên`} onClose={onClose}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr>
              <th className="w-28" />
              {pts.map((p) => (
                <th key={p.id} className="px-3 pb-2 text-left text-sm font-bold text-foreground">
                  <Link href={`/trainers/${p.id}`} className="text-primary hover:underline">
                    {p.displayName}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Đánh giá" values={pts.map((p) => (
              <RatingStars key={p.id} rating={p.averageRating} count={p.reviewCount} />
            ))} />
            <Row label="Chuyên môn" values={pts.map((p) => p.specialization ?? null)} />
            <Row label="Kinh nghiệm" values={pts.map((p) =>
              p.experienceYears != null ? `${p.experienceYears} năm` : null)} />
            <Row label="Khu vực" values={pts.map((p) => p.serviceArea ?? null)} />
            <Row label="Phòng gym" values={pts.map((p) => p.gymName ?? null)} />
            <Row label="Xác thực" values={pts.map((p) => (p.verified ? "✅ Đã xác thực" : "—"))} />
          </tbody>
        </table>
      </div>
    </Dialog>
  );
}
