"use client";

import Link from "next/link";
import type { GymPublicProfile, PtPublicProfile } from "@/services/marketplace.service";
import { RatingStars } from "@/shared/components/common/rating-stars";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

/**
 * UC-010: bảng so sánh side-by-side 2-3 mục đã chọn từ danh sách yêu thích.
 * Dữ liệu lấy từ chính response favorites (đã kèm rating denorm V51) — không gọi thêm API.
 */

function Row({ label, values }: { label: string; values: React.ReactNode[] }) {
  return (
    <TableRow className="last:border-0">
      <TableCell className="py-2.5 pr-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
        {label}
      </TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className="py-2.5 text-sm text-foreground align-top">
          {v ?? "—"}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function CompareGymsDialog({
  open, onClose, gyms,
}: { open: boolean; onClose: () => void; gyms: GymPublicProfile[] }) {
  const t = useTranslations();
  return (
    <Dialog open={open} title={t("compare.gyms", { count: gyms.length })} onClose={onClose}>
      <TableContainer>
        <Table className="min-w-[480px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28" />
              {gyms.map((g) => (
                <TableHead key={g.id} className="pb-2 text-sm font-bold text-foreground">
                  <Link href={`/gyms/${g.id}`} className="text-primary hover:underline">
                    {g.gymName}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <Row label={t("compare.rating")} values={gyms.map((g) => (
              <RatingStars key={g.id} rating={g.averageRating} count={g.reviewCount} />
            ))} />
            <Row label={t("compare.area")} values={gyms.map((g) =>
              [g.district, g.city].filter(Boolean).join(", ") || null)} />
            <Row label={t("common.table.address")} values={gyms.map((g) => g.address ?? null)} />
            <Row label={t("compare.phone")} values={gyms.map((g) => g.phone ?? null)} />
            <Row label={t("compare.verification")} values={gyms.map((g) => (g.verified ? t("compare.verified") : "—"))} />
            <Row label={t("compare.about")} values={gyms.map((g) => (
              <span key={g.id} className="line-clamp-3 text-muted-foreground">{g.description ?? "—"}</span>
            ))} />
          </TableBody>
        </Table>
      </TableContainer>
    </Dialog>
  );
}

export function ComparePtsDialog({
  open, onClose, pts,
}: { open: boolean; onClose: () => void; pts: PtPublicProfile[] }) {
  const t = useTranslations();
  return (
    <Dialog open={open} title={t("compare.trainers", { count: pts.length })} onClose={onClose}>
      <TableContainer>
        <Table className="min-w-[480px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28" />
              {pts.map((p) => (
                <TableHead key={p.id} className="pb-2 text-sm font-bold text-foreground">
                  <Link href={`/trainers/${p.id}`} className="text-primary hover:underline">
                    {p.displayName}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <Row label={t("compare.rating")} values={pts.map((p) => (
              <RatingStars key={p.id} rating={p.averageRating} count={p.reviewCount} />
            ))} />
            <Row label={t("compare.specialisation")} values={pts.map((p) => p.specialization ?? null)} />
            <Row label={t("compare.experience")} values={pts.map((p) =>
              p.experienceYears != null ? t("compare.years", { years: p.experienceYears }) : null)} />
            <Row label={t("compare.area")} values={pts.map((p) => p.serviceArea ?? null)} />
            <Row label={t("compare.gym")} values={pts.map((p) => p.gymName ?? null)} />
            <Row label={t("compare.authenticity")} values={pts.map((p) => (p.verified ? t("compare.authenticated") : "—"))} />
          </TableBody>
        </Table>
      </TableContainer>
    </Dialog>
  );
}
