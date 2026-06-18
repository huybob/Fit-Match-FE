"use client";

import {
  Activity,
  Bell,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Dumbbell,
  Filter,
  LayoutDashboard,
  LineChart,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn.util";

const navigation = [
  { label: "Tong quan", icon: LayoutDashboard, active: true },
  { label: "Lich tap", icon: CalendarClock },
  { label: "PT", icon: UserCheck },
  { label: "Hoi vien", icon: UsersRound },
  { label: "Check-in QR", icon: QrCode },
  { label: "Doanh thu", icon: LineChart },
];

const metrics = [
  {
    label: "Booking hom nay",
    value: "128",
    helper: "96 da xac nhan",
    icon: CalendarCheck,
    tone: "emerald",
  },
  {
    label: "PT dang co lich",
    value: "18",
    helper: "6 PT con slot",
    icon: Dumbbell,
    tone: "zinc",
  },
  {
    label: "Check-in trong ngay",
    value: "342",
    helper: "+14% so voi hom qua",
    icon: QrCode,
    tone: "orange",
  },
  {
    label: "Gia han can xu ly",
    value: "27",
    helper: "Trong 7 ngay toi",
    icon: CreditCard,
    tone: "red",
  },
];

const todaySessions = [
  {
    time: "06:30",
    title: "Strength Foundation",
    trainer: "Tran Minh",
    room: "Studio A",
    booked: 18,
    capacity: 20,
    status: "Sap dien ra",
  },
  {
    time: "08:00",
    title: "PT 1:1 - Upper Body",
    trainer: "Ngoc Anh",
    room: "PT Zone 02",
    booked: 1,
    capacity: 1,
    status: "Da xac nhan",
  },
  {
    time: "10:30",
    title: "Yoga Mobility",
    trainer: "Linh Chi",
    room: "Studio B",
    booked: 12,
    capacity: 18,
    status: "Con cho",
  },
  {
    time: "18:30",
    title: "HIIT Afterwork",
    trainer: "Hoang Nam",
    room: "Studio A",
    booked: 24,
    capacity: 24,
    status: "Full",
  },
];

const trainers = [
  {
    name: "Tran Minh",
    role: "Strength Coach",
    rating: "4.9",
    sessions: "7 ca",
    commission: "3.2tr",
    status: "Dang day",
  },
  {
    name: "Ngoc Anh",
    role: "Personal Trainer",
    rating: "4.8",
    sessions: "5 ca",
    commission: "2.6tr",
    status: "Con slot",
  },
  {
    name: "Hoang Nam",
    role: "HIIT Coach",
    rating: "4.7",
    sessions: "6 ca",
    commission: "2.9tr",
    status: "Full lich",
  },
  {
    name: "Linh Chi",
    role: "Yoga Coach",
    rating: "5.0",
    sessions: "4 ca",
    commission: "1.8tr",
    status: "Con slot",
  },
];

const members = [
  {
    name: "Pham Duc Anh",
    plan: "Premium 12 thang",
    lastCheckIn: "07:12",
    renewal: "Con 28 ngay",
    tag: "Active",
  },
  {
    name: "Mai Hoang Yen",
    plan: "PT Combo 24 buoi",
    lastCheckIn: "Hom qua",
    renewal: "Can goi lai",
    tag: "Follow-up",
  },
  {
    name: "Le Quang Huy",
    plan: "Basic 6 thang",
    lastCheckIn: "3 ngay truoc",
    renewal: "Con 9 ngay",
    tag: "Renew",
  },
];

const checkIns = [
  { name: "Nguyen Bao Tram", time: "09:12", gate: "Gate 01" },
  { name: "Doan Minh Quan", time: "09:09", gate: "Gate 02" },
  { name: "Vu Linh Dan", time: "09:06", gate: "Gate 01" },
];

const branchTasks = [
  "Duyet 12 booking cho lop HIIT 18:30",
  "Nhac 8 hoi vien sap het han goi tap",
  "Kiem tra hoa hong PT thang 06",
  "Dong bo lich Google Calendar cho 3 PT moi",
];

export function GymWorkspacePage() {
  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
            <WorkspaceHeader />
            <MetricGrid />
            <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
              <TodaySchedule />
              <BookingPanel />
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <TrainerRoster />
              <MemberAndCheckin />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5">
        <div className="flex size-10 items-center justify-center rounded-md bg-zinc-950 text-white">
          <Dumbbell className="size-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-5">FitMatch OS</p>
          <p className="text-xs font-medium text-zinc-500">Gym workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950",
                item.active && "bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <Card className="border-emerald-200 bg-emerald-50 p-4 shadow-none">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-emerald-600" />
            <p className="text-sm font-bold text-emerald-900">Dong bo realtime</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-800">
            Lich tap, check-in va booking duoc cap nhat lien tuc giua le tan,
            PT va quan ly.
          </p>
        </Card>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-md bg-zinc-950 text-white">
            <Dumbbell className="size-4" />
          </div>
          <span className="text-sm font-bold">FitMatch OS</span>
        </div>

        <div className="hidden min-w-0 flex-1 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 md:flex">
          <Search className="size-4 text-zinc-400" />
          <input
            aria-label="Tim kiem"
            placeholder="Tim hoi vien, PT, ma booking..."
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button className="hidden h-10 bg-white px-3 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50 sm:inline-flex">
            <Filter className="size-4" />
            Chi nhanh Quan 1
            <ChevronDown className="size-4" />
          </Button>
          <Button className="size-10 bg-white p-0 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
            <Bell className="size-4" />
          </Button>
          <Button className="size-10 bg-white p-0 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
            <Settings className="size-4" />
          </Button>
          <Button className="h-10 bg-emerald-500 px-4 font-bold text-zinc-950 hover:bg-emerald-400">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Tao booking</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function WorkspaceHeader() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto]"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Hom nay · Thu nam, 18/06/2026
          </Badge>
          <Badge className="border-orange-200 bg-orange-50 text-orange-700">
            4 viec can xu ly
          </Badge>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          Bang dieu phoi van hanh phong gym
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
          Theo doi lich tap, danh sach PT, booking, check-in QR va tinh trang
          hoi vien tren mot man hinh lam viec tap trung.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
        <Button className="h-10 bg-white text-zinc-800 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
          <Smartphone className="size-4" />
          App hoi vien
        </Button>
        <Button className="h-10 bg-zinc-950 text-white hover:bg-zinc-800">
          <QrCode className="size-4" />
          Mo QR check-in
        </Button>
      </div>
    </motion.section>
  );
}

function MetricGrid() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight">
                    {metric.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-md",
                    metric.tone === "emerald" && "bg-emerald-50 text-emerald-700",
                    metric.tone === "orange" && "bg-orange-50 text-orange-700",
                    metric.tone === "red" && "bg-red-50 text-red-700",
                    metric.tone === "zinc" && "bg-zinc-100 text-zinc-700",
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-zinc-600">
                {metric.helper}
              </p>
            </Card>
          </motion.div>
        );
      })}
    </section>
  );
}

function TodaySchedule() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-500">Lich tap</p>
          <h2 className="mt-1 text-xl font-bold">Lich phong va PT hom nay</h2>
        </div>
        <div className="flex gap-2">
          <Button className="h-9 bg-white px-3 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
            <Clock3 className="size-4" />
            Timeline
          </Button>
          <Button className="h-9 bg-zinc-950 px-3 text-white hover:bg-zinc-800">
            <Plus className="size-4" />
            Them lich
          </Button>
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {todaySessions.map((session) => (
          <div
            key={`${session.time}-${session.title}`}
            className="grid gap-4 p-5 md:grid-cols-[90px_1fr_170px_130px]"
          >
            <div className="text-sm font-bold text-zinc-950">{session.time}</div>
            <div>
              <p className="font-bold text-zinc-950">{session.title}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {session.trainer} · {session.room}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>Da book</span>
                <span>
                  {session.booked}/{session.capacity}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(
                      (session.booked / session.capacity) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-start justify-start md:justify-end">
              <StatusBadge status={session.status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BookingPanel() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-500">Book lich nhanh</p>
          <h2 className="mt-1 text-xl font-bold">Tao booking PT/lop tap</h2>
        </div>
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          Realtime
        </Badge>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Hoi vien" value="Pham Duc Anh" />
        <Field label="Loai lich" value="PT 1:1 - Strength" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field label="Ngay" value="18/06/2026" />
          <Field label="Gio" value="16:30" />
        </div>
        <Field label="PT phu trach" value="Ngoc Anh · Con 2 slot" />
      </div>

      <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-orange-600" />
          <p className="text-sm font-bold">Kiem tra xung dot lich</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Khong trung lich PT. Hoi vien con 18 buoi trong goi PT Combo.
        </p>
      </div>

      <Button className="mt-5 h-11 w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400">
        <Check className="size-4" />
        Xac nhan booking
      </Button>
    </Card>
  );
}

function TrainerRoster() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-200 p-5">
        <div>
          <p className="text-sm font-semibold text-zinc-500">Danh sach PT</p>
          <h2 className="mt-1 text-xl font-bold">Trang thai lam viec</h2>
        </div>
        <Button className="h-9 bg-white px-3 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
          <Plus className="size-4" />
          PT moi
        </Button>
      </div>

      <div className="divide-y divide-zinc-100">
        {trainers.map((trainer) => (
          <div key={trainer.name} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm font-bold text-zinc-800">
                {trainer.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-zinc-950">{trainer.name}</p>
                <p className="mt-1 text-sm text-zinc-500">{trainer.role}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 fill-orange-400 text-orange-400" />
                    {trainer.rating}
                  </span>
                  <span>{trainer.sessions}</span>
                  <span>Hoa hong {trainer.commission}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={trainer.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function MemberAndCheckin() {
  return (
    <div className="grid gap-5 2xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 p-5">
          <div>
            <p className="text-sm font-semibold text-zinc-500">Hoi vien</p>
            <h2 className="mt-1 text-xl font-bold">Can cham soc hom nay</h2>
          </div>
          <Button className="h-9 bg-white px-3 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
            Xem tat ca
          </Button>
        </div>
        <div className="divide-y divide-zinc-100">
          {members.map((member) => (
            <div key={member.name} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-zinc-950">{member.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{member.plan}</p>
                </div>
                <StatusBadge status={member.tag} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-zinc-50 p-3">
                  <p className="text-xs font-semibold text-zinc-500">
                    Check-in gan nhat
                  </p>
                  <p className="mt-1 font-bold">{member.lastCheckIn}</p>
                </div>
                <div className="rounded-md bg-zinc-50 p-3">
                  <p className="text-xs font-semibold text-zinc-500">Gia han</p>
                  <p className="mt-1 font-bold">{member.renewal}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-500">QR Check-in</p>
              <h2 className="mt-1 text-xl font-bold">Hang doi vao phong</h2>
            </div>
            <div className="grid size-14 grid-cols-4 gap-1 rounded-md bg-zinc-950 p-2">
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
          <div className="mt-5 space-y-3">
            {checkIns.map((checkIn) => (
              <div
                key={checkIn.name}
                className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 p-3"
              >
                <div>
                  <p className="text-sm font-bold">{checkIn.name}</p>
                  <p className="text-xs text-zinc-500">{checkIn.gate}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {checkIn.time}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-zinc-500">Viec can xu ly</p>
          <div className="mt-4 space-y-3">
            {branchTasks.map((task) => (
              <label
                key={task}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-3 text-sm font-semibold text-zinc-700"
              >
                <input type="checkbox" className="mt-1 size-4 accent-emerald-500" />
                {task}
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-zinc-500">{label}</span>
      <button className="mt-2 flex h-11 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 text-left text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50">
        {value}
        <ChevronDown className="size-4 text-zinc-400" />
      </button>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Full" ||
    status === "Full lich" ||
    status === "Follow-up" ||
    status === "Renew"
      ? "orange"
      : status === "Con cho" || status === "Con slot" || status === "Active"
        ? "emerald"
        : "zinc";

  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-bold",
        tone === "emerald" && "bg-emerald-50 text-emerald-700",
        tone === "orange" && "bg-orange-50 text-orange-700",
        tone === "zinc" && "bg-zinc-100 text-zinc-700",
      )}
    >
      {status}
    </span>
  );
}
