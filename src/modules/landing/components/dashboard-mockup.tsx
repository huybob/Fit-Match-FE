"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CalendarCheck,
  DollarSign,
  QrCode,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn.util";

const metrics = [
  {
    label: "Tổng hội viên",
    value: "12.480",
    change: "+18.2%",
    icon: UsersRound,
  },
  {
    label: "Lịch PT hôm nay",
    value: "86",
    change: "24 ca trống",
    icon: CalendarCheck,
  },
  {
    label: "Doanh thu tháng",
    value: "2.4 tỷ",
    change: "+22.4%",
    icon: DollarSign,
  },
  {
    label: "Booking trong ngày",
    value: "342",
    change: "96% xác nhận",
    icon: Activity,
  },
  {
    label: "Tỷ lệ gia hạn",
    value: "78%",
    change: "+9.1%",
    icon: TrendingUp,
  },
];

const sessions = [
  { time: "07:30", name: "HIIT Morning", coach: "Minh Anh", status: "Đầy" },
  { time: "10:00", name: "PT Strength", coach: "Hoàng Nam", status: "Còn 2" },
  { time: "18:30", name: "Yoga Flow", coach: "Linh Chi", status: "Còn 8" },
];

type DashboardMockupProps = {
  compact?: boolean;
  className?: string;
};

export function DashboardMockup({ compact = false, className }: DashboardMockupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 p-3 shadow-2xl shadow-zinc-950/20",
        className,
      )}
    >
      <div className="rounded-md border border-white/10 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-emerald-500 text-white">
              <QrCode className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">FitMatch OS</p>
              <p className="text-xs text-zinc-500">Gym Operations Dashboard</p>
            </div>
          </div>
          <div className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:block">
            Live sync
          </div>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.slice(0, compact ? 4 : 5).map((metric, index) => {
                const Icon = metric.icon;

                return (
                  <Card
                    key={metric.label}
                    className={cn(
                      "border-zinc-200 p-4",
                      index === 2 && !compact ? "sm:col-span-2" : "",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-zinc-500">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                          {metric.value}
                        </p>
                      </div>
                      <div className="flex size-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-emerald-600">
                      {metric.change}
                    </p>
                  </Card>
                );
              })}
            </div>

            <Card className="border-zinc-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    Doanh thu theo tuần
                  </p>
                  <p className="text-xs text-zinc-500">Membership, PT, lớp nhóm</p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  +31%
                </span>
              </div>
              <div className="flex h-32 items-end gap-2">
                {[42, 56, 48, 72, 65, 88, 96].map((height, index) => (
                  <div
                    key={height + index}
                    className="flex flex-1 items-end rounded-sm bg-zinc-100"
                  >
                    <div
                      className="w-full rounded-sm bg-emerald-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <Card className="border-zinc-200 p-4">
              <p className="text-sm font-semibold text-zinc-950">Lịch PT hôm nay</p>
              <div className="mt-4 space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.time}
                    className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {session.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {session.time} · {session.coach}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-zinc-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    QR Check-in
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    1.842 lượt tuần này
                  </p>
                </div>
                <div className="grid size-16 grid-cols-4 gap-1 rounded-md bg-zinc-950 p-2">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "rounded-[1px] bg-white",
                        [1, 4, 6, 11, 13].includes(index) && "bg-emerald-400",
                      )}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
