"use client";

import { useMemo, useState } from "react";
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

type Language = "vi" | "en";

const copy = {
  vi: {
    nav: ["Tổng quan", "Lịch tập", "PT", "Hội viên", "Check-in QR", "Doanh thu"],
    brandSubtitle: "Không gian vận hành",
    synced: "Đồng bộ realtime",
    syncedText:
      "Lịch tập, check-in và booking được cập nhật liên tục giữa lễ tân, PT và quản lý.",
    search: "Tìm hội viên, PT, mã booking...",
    branch: "Chi nhánh Quận 1",
    branches: [
      "Chi nhánh Quận 1",
      "Chi nhánh Thảo Điền",
      "Chi nhánh Phú Nhuận",
      "Chi nhánh Cầu Giấy",
    ],
    sidebarSection: "Dữ liệu nhanh",
    sidebarStats: [
      ["Sức chứa hiện tại", "74%", "342/460 check-in"],
      ["Slot PT còn trống", "18", "Trong ngày hôm nay"],
      ["Booking chờ duyệt", "12", "Cần xử lý trước 17:00"],
    ],
    notificationsTitle: "Thông báo",
    notifications: [
      ["Lớp HIIT 18:30 đã full", "2 phút trước"],
      ["8 hội viên sắp hết hạn gói", "15 phút trước"],
      ["PT Ngọc Anh đổi lịch 16:30", "32 phút trước"],
    ],
    settingsTitle: "Cài đặt nhanh",
    settings: [
      "Phân quyền nhân sự",
      "Cấu hình QR check-in",
      "Đồng bộ Google Calendar",
      "Thiết lập hoa hồng PT",
    ],
    createBooking: "Tạo booking",
    date: "Hôm nay · Thứ năm, 18/06/2026",
    tasksCount: "4 việc cần xử lý",
    title: "Bảng điều phối vận hành phòng gym",
    subtitle:
      "Theo dõi lịch tập, danh sách PT, booking, check-in QR và tình trạng hội viên trên một màn hình làm việc tập trung.",
    memberApp: "App hội viên",
    qr: "Mở QR check-in",
    metrics: [
      ["Booking hôm nay", "128", "96 đã xác nhận"],
      ["PT đang có lịch", "18", "6 PT còn slot"],
      ["Check-in trong ngày", "342", "+14% so với hôm qua"],
      ["Gia hạn cần xử lý", "27", "Trong 7 ngày tới"],
    ],
    schedule: "Lịch tập",
    scheduleTitle: "Lịch phòng và PT hôm nay",
    timeline: "Timeline",
    addSchedule: "Thêm lịch",
    sessions: [
      ["06:30", "Strength Foundation", "Trần Minh", "Studio A", "18", "20", "Sắp diễn ra"],
      ["08:00", "PT 1:1 - Upper Body", "Ngọc Anh", "PT Zone 02", "1", "1", "Đã xác nhận"],
      ["10:30", "Yoga Mobility", "Linh Chi", "Studio B", "12", "18", "Còn chỗ"],
      ["18:30", "HIIT Afterwork", "Hoàng Nam", "Studio A", "24", "24", "Full"],
    ],
    booked: "Đã book",
    quickBook: "Book lịch nhanh",
    quickBookTitle: "Tạo booking PT/lớp tập",
    realtime: "Realtime",
    fields: [
      ["Hội viên", "Phạm Đức Anh"],
      ["Loại lịch", "PT 1:1 - Strength"],
      ["Ngày", "18/06/2026"],
      ["Giờ", "16:30"],
      ["PT phụ trách", "Ngọc Anh · Còn 2 slot"],
    ],
    conflictTitle: "Kiểm tra xung đột lịch",
    conflictText: "Không trùng lịch PT. Hội viên còn 18 buổi trong gói PT Combo.",
    confirmBooking: "Xác nhận booking",
    trainersLabel: "Danh sách PT",
    trainersTitle: "Trạng thái làm việc",
    newTrainer: "PT mới",
    trainers: [
      ["Trần Minh", "Strength Coach", "4.9", "7 ca", "3.2tr", "Đang dạy"],
      ["Ngọc Anh", "Personal Trainer", "4.8", "5 ca", "2.6tr", "Còn slot"],
      ["Hoàng Nam", "HIIT Coach", "4.7", "6 ca", "2.9tr", "Full lịch"],
      ["Linh Chi", "Yoga Coach", "5.0", "4 ca", "1.8tr", "Còn slot"],
    ],
    commission: "Hoa hồng",
    membersLabel: "Hội viên",
    membersTitle: "Cần chăm sóc hôm nay",
    viewAll: "Xem tất cả",
    members: [
      ["Phạm Đức Anh", "Premium 12 tháng", "07:12", "Còn 28 ngày", "Active"],
      ["Mai Hoàng Yến", "PT Combo 24 buổi", "Hôm qua", "Cần gọi lại", "Follow-up"],
      ["Lê Quang Huy", "Basic 6 tháng", "3 ngày trước", "Còn 9 ngày", "Renew"],
    ],
    lastCheckIn: "Check-in gần nhất",
    renewal: "Gia hạn",
    queueTitle: "Hàng đợi vào phòng",
    checkIns: [
      ["Nguyễn Bảo Trâm", "09:12", "Gate 01"],
      ["Đoàn Minh Quân", "09:09", "Gate 02"],
      ["Vũ Linh Đan", "09:06", "Gate 01"],
    ],
    todoLabel: "Việc cần xử lý",
    tasks: [
      "Duyệt 12 booking cho lớp HIIT 18:30",
      "Nhắc 8 hội viên sắp hết hạn gói tập",
      "Kiểm tra hoa hồng PT tháng 06",
      "Đồng bộ lịch Google Calendar cho 3 PT mới",
    ],
  },
  en: {
    nav: ["Overview", "Schedule", "Trainers", "Members", "QR Check-in", "Revenue"],
    brandSubtitle: "Operations workspace",
    synced: "Realtime sync",
    syncedText:
      "Schedules, check-ins, and bookings stay synchronized across front desk, trainers, and managers.",
    search: "Search members, trainers, booking codes...",
    branch: "District 1 Branch",
    branches: [
      "District 1 Branch",
      "Thao Dien Branch",
      "Phu Nhuan Branch",
      "Cau Giay Branch",
    ],
    sidebarSection: "Quick data",
    sidebarStats: [
      ["Current capacity", "74%", "342/460 checked in"],
      ["Open PT slots", "18", "Today"],
      ["Pending bookings", "12", "Handle before 17:00"],
    ],
    notificationsTitle: "Notifications",
    notifications: [
      ["HIIT 18:30 is fully booked", "2 minutes ago"],
      ["8 members have expiring packages", "15 minutes ago"],
      ["Trainer Ngoc Anh moved the 16:30 slot", "32 minutes ago"],
    ],
    settingsTitle: "Quick settings",
    settings: [
      "Staff permissions",
      "QR check-in configuration",
      "Google Calendar sync",
      "Trainer commission rules",
    ],
    createBooking: "Create booking",
    date: "Today · Thursday, 18/06/2026",
    tasksCount: "4 tasks to handle",
    title: "Gym operations command center",
    subtitle:
      "Track schedules, trainers, bookings, QR check-ins, and member status in one focused work screen.",
    memberApp: "Member app",
    qr: "Open QR check-in",
    metrics: [
      ["Bookings today", "128", "96 confirmed"],
      ["Scheduled trainers", "18", "6 trainers available"],
      ["Check-ins today", "342", "+14% vs yesterday"],
      ["Renewals to handle", "27", "Next 7 days"],
    ],
    schedule: "Schedule",
    scheduleTitle: "Rooms and trainers today",
    timeline: "Timeline",
    addSchedule: "Add schedule",
    sessions: [
      ["06:30", "Strength Foundation", "Tran Minh", "Studio A", "18", "20", "Starting soon"],
      ["08:00", "PT 1:1 - Upper Body", "Ngoc Anh", "PT Zone 02", "1", "1", "Confirmed"],
      ["10:30", "Yoga Mobility", "Linh Chi", "Studio B", "12", "18", "Available"],
      ["18:30", "HIIT Afterwork", "Hoang Nam", "Studio A", "24", "24", "Full"],
    ],
    booked: "Booked",
    quickBook: "Quick booking",
    quickBookTitle: "Create PT/class booking",
    realtime: "Realtime",
    fields: [
      ["Member", "Pham Duc Anh"],
      ["Booking type", "PT 1:1 - Strength"],
      ["Date", "18/06/2026"],
      ["Time", "16:30"],
      ["Trainer", "Ngoc Anh · 2 slots left"],
    ],
    conflictTitle: "Schedule conflict check",
    conflictText: "No trainer conflict. Member has 18 sessions left in the PT Combo package.",
    confirmBooking: "Confirm booking",
    trainersLabel: "Trainers",
    trainersTitle: "Working status",
    newTrainer: "New trainer",
    trainers: [
      ["Tran Minh", "Strength Coach", "4.9", "7 sessions", "3.2m", "Teaching"],
      ["Ngoc Anh", "Personal Trainer", "4.8", "5 sessions", "2.6m", "Available"],
      ["Hoang Nam", "HIIT Coach", "4.7", "6 sessions", "2.9m", "Fully booked"],
      ["Linh Chi", "Yoga Coach", "5.0", "4 sessions", "1.8m", "Available"],
    ],
    commission: "Commission",
    membersLabel: "Members",
    membersTitle: "Need attention today",
    viewAll: "View all",
    members: [
      ["Pham Duc Anh", "Premium 12 months", "07:12", "28 days left", "Active"],
      ["Mai Hoang Yen", "PT Combo 24 sessions", "Yesterday", "Call back", "Follow-up"],
      ["Le Quang Huy", "Basic 6 months", "3 days ago", "9 days left", "Renew"],
    ],
    lastCheckIn: "Last check-in",
    renewal: "Renewal",
    queueTitle: "Entry queue",
    checkIns: [
      ["Nguyen Bao Tram", "09:12", "Gate 01"],
      ["Doan Minh Quan", "09:09", "Gate 02"],
      ["Vu Linh Dan", "09:06", "Gate 01"],
    ],
    todoLabel: "Tasks to handle",
    tasks: [
      "Approve 12 bookings for HIIT 18:30",
      "Remind 8 members with expiring packages",
      "Review trainer commissions for June",
      "Sync Google Calendar for 3 new trainers",
    ],
  },
} satisfies Record<Language, Record<string, unknown>>;

const metricIcons = [CalendarCheck, Dumbbell, QrCode, CreditCard];
const metricTones = ["emerald", "zinc", "orange", "red"] as const;
const navIcons = [LayoutDashboard, CalendarClock, UserCheck, UsersRound, QrCode, LineChart];
const navBadges = ["Live", "128", "18", "27", "342", "+14%"];

export function GymWorkspacePage() {
  const [language, setLanguage] = useState<Language>("vi");
  const t = copy[language];

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="flex min-h-screen">
        <Sidebar t={t} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar t={t} language={language} onLanguageChange={setLanguage} />
          <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
            <WorkspaceHeader t={t} />
            <MetricGrid t={t} />
            <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
              <TodaySchedule t={t} />
              <BookingPanel t={t} />
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <TrainerRoster t={t} />
              <MemberAndCheckin t={t} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

type Copy = typeof copy.vi;

function Sidebar({ t }: { t: Copy }) {
  const navItems = useMemo(
    () =>
      t.nav.map((label, index) => ({
        label,
        badge: navBadges[index],
        Icon: navIcons[index],
        active: index === 0,
      })),
    [t.nav],
  );

  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5">
        <div className="flex size-10 items-center justify-center rounded-md bg-zinc-950 text-white">
          <Dumbbell className="size-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-5">FitMatch OS</p>
          <p className="text-xs font-medium text-zinc-500">{t.brandSubtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ label, badge, Icon, active }) => (
          <button
            key={label}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950",
              active && "bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                active ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-600",
              )}
            >
              {badge}
            </span>
          </button>
        ))}

        <div className="pt-5">
          <p className="px-3 text-xs font-bold uppercase text-zinc-400">
            {t.sidebarSection}
          </p>
          <div className="mt-3 space-y-2">
            {t.sidebarStats.map(([label, value, helper]) => (
              <div
                key={label}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-zinc-500">{label}</p>
                  <p className="text-sm font-bold text-zinc-950">{value}</p>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{helper}</p>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <Card className="border-emerald-200 bg-emerald-50 p-4 shadow-none">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-emerald-600" />
            <p className="text-sm font-bold text-emerald-900">{t.synced}</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-800">{t.syncedText}</p>
        </Card>
      </div>
    </aside>
  );
}

function TopBar({
  t,
  language,
  onLanguageChange,
}: {
  t: Copy;
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            aria-label={t.search}
            placeholder={t.search}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex h-10 rounded-md border border-zinc-200 bg-zinc-50 p-1">
            {(["vi", "en"] as const).map((option) => (
              <button
                key={option}
                onClick={() => onLanguageChange(option)}
                className={cn(
                  "h-8 rounded px-3 text-xs font-bold transition",
                  language === option
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-white",
                )}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>

          <label className="relative hidden h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 sm:flex">
            <Filter className="size-4 text-zinc-500" />
            <select
              aria-label={t.branch}
              value={selectedBranchIndex}
              onChange={(event) => setSelectedBranchIndex(Number(event.target.value))}
              className="max-w-44 appearance-none bg-transparent pr-6 outline-none"
            >
              {t.branches.map((branch, index) => (
                <option key={branch} value={index}>
                  {branch}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-4 text-zinc-400" />
          </label>

          <div className="relative">
            <Button
              className="relative size-10 bg-white p-0 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50"
              onClick={() => {
                setIsNotificationsOpen((value) => !value);
                setIsSettingsOpen(false);
              }}
              aria-label={t.notificationsTitle}
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-orange-500" />
            </Button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-950/10">
                <p className="px-2 pb-2 text-sm font-bold text-zinc-950">
                  {t.notificationsTitle}
                </p>
                <div className="space-y-1">
                  {t.notifications.map(([title, time]) => (
                    <button
                      key={title}
                      className="w-full rounded-md p-2 text-left transition hover:bg-zinc-50"
                    >
                      <p className="text-sm font-semibold text-zinc-800">{title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{time}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              className="size-10 bg-white p-0 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50"
              onClick={() => {
                setIsSettingsOpen((value) => !value);
                setIsNotificationsOpen(false);
              }}
              aria-label={t.settingsTitle}
            >
              <Settings className="size-4" />
            </Button>

            {isSettingsOpen && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-950/10">
                <p className="px-2 pb-2 text-sm font-bold text-zinc-950">
                  {t.settingsTitle}
                </p>
                <div className="space-y-1">
                  {t.settings.map((setting) => (
                    <button
                      key={setting}
                      className="flex w-full items-center justify-between rounded-md p-2 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      {setting}
                      <ChevronDown className="-rotate-90 size-4 text-zinc-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button className="h-10 bg-emerald-500 px-4 font-bold text-zinc-950 hover:bg-emerald-400">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t.createBooking}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function WorkspaceHeader({ t }: { t: Copy }) {
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
            {t.date}
          </Badge>
          <Badge className="border-orange-200 bg-orange-50 text-orange-700">
            {t.tasksCount}
          </Badge>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
        <Button className="h-10 bg-white text-zinc-800 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
          <Smartphone className="size-4" />
          {t.memberApp}
        </Button>
        <Button className="h-10 bg-zinc-950 text-white hover:bg-zinc-800">
          <QrCode className="size-4" />
          {t.qr}
        </Button>
      </div>
    </motion.section>
  );
}

function MetricGrid({ t }: { t: Copy }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {t.metrics.map(([label, value, helper], index) => {
        const Icon = metricIcons[index];
        const tone = metricTones[index];

        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
                </div>
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-md",
                    tone === "emerald" && "bg-emerald-50 text-emerald-700",
                    tone === "orange" && "bg-orange-50 text-orange-700",
                    tone === "red" && "bg-red-50 text-red-700",
                    tone === "zinc" && "bg-zinc-100 text-zinc-700",
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-zinc-600">{helper}</p>
            </Card>
          </motion.div>
        );
      })}
    </section>
  );
}

function TodaySchedule({ t }: { t: Copy }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-500">{t.schedule}</p>
          <h2 className="mt-1 text-xl font-bold">{t.scheduleTitle}</h2>
        </div>
        <div className="flex gap-2">
          <Button className="h-9 bg-white px-3 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
            <Clock3 className="size-4" />
            {t.timeline}
          </Button>
          <Button className="h-9 bg-zinc-950 px-3 text-white hover:bg-zinc-800">
            <Plus className="size-4" />
            {t.addSchedule}
          </Button>
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {t.sessions.map(([time, title, trainer, room, booked, capacity, status]) => (
          <div
            key={`${time}-${title}`}
            className="grid gap-4 p-5 md:grid-cols-[90px_1fr_170px_130px]"
          >
            <div className="text-sm font-bold text-zinc-950">{time}</div>
            <div>
              <p className="font-bold text-zinc-950">{title}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {trainer} · {room}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>{t.booked}</span>
                <span>
                  {booked}/{capacity}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min((Number(booked) / Number(capacity)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-start justify-start md:justify-end">
              <StatusBadge status={status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BookingPanel({ t }: { t: Copy }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-500">{t.quickBook}</p>
          <h2 className="mt-1 text-xl font-bold">{t.quickBookTitle}</h2>
        </div>
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          {t.realtime}
        </Badge>
      </div>

      <div className="mt-5 space-y-4">
        <Field label={t.fields[0][0]} value={t.fields[0][1]} />
        <Field label={t.fields[1][0]} value={t.fields[1][1]} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Field label={t.fields[2][0]} value={t.fields[2][1]} />
          <Field label={t.fields[3][0]} value={t.fields[3][1]} />
        </div>
        <Field label={t.fields[4][0]} value={t.fields[4][1]} />
      </div>

      <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-orange-600" />
          <p className="text-sm font-bold">{t.conflictTitle}</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{t.conflictText}</p>
      </div>

      <Button className="mt-5 h-11 w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400">
        <Check className="size-4" />
        {t.confirmBooking}
      </Button>
    </Card>
  );
}

function TrainerRoster({ t }: { t: Copy }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-200 p-5">
        <div>
          <p className="text-sm font-semibold text-zinc-500">{t.trainersLabel}</p>
          <h2 className="mt-1 text-xl font-bold">{t.trainersTitle}</h2>
        </div>
        <Button className="h-9 bg-white px-3 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
          <Plus className="size-4" />
          {t.newTrainer}
        </Button>
      </div>

      <div className="divide-y divide-zinc-100">
        {t.trainers.map(([name, role, rating, sessions, commission, status]) => (
          <div key={name} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm font-bold text-zinc-800">
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-zinc-950">{name}</p>
                <p className="mt-1 text-sm text-zinc-500">{role}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 fill-orange-400 text-orange-400" />
                    {rating}
                  </span>
                  <span>{sessions}</span>
                  <span>
                    {t.commission} {commission}
                  </span>
                </div>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function MemberAndCheckin({ t }: { t: Copy }) {
  return (
    <div className="grid gap-5 2xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 p-5">
          <div>
            <p className="text-sm font-semibold text-zinc-500">{t.membersLabel}</p>
            <h2 className="mt-1 text-xl font-bold">{t.membersTitle}</h2>
          </div>
          <Button className="h-9 bg-white px-3 text-zinc-700 shadow-none ring-1 ring-zinc-200 hover:bg-zinc-50">
            {t.viewAll}
          </Button>
        </div>
        <div className="divide-y divide-zinc-100">
          {t.members.map(([name, plan, lastCheckIn, renewal, tag]) => (
            <div key={name} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-zinc-950">{name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{plan}</p>
                </div>
                <StatusBadge status={tag} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-zinc-50 p-3">
                  <p className="text-xs font-semibold text-zinc-500">
                    {t.lastCheckIn}
                  </p>
                  <p className="mt-1 font-bold">{lastCheckIn}</p>
                </div>
                <div className="rounded-md bg-zinc-50 p-3">
                  <p className="text-xs font-semibold text-zinc-500">{t.renewal}</p>
                  <p className="mt-1 font-bold">{renewal}</p>
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
              <h2 className="mt-1 text-xl font-bold">{t.queueTitle}</h2>
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
            {t.checkIns.map(([name, time, gate]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 p-3"
              >
                <div>
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-xs text-zinc-500">{gate}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-zinc-500">{t.todoLabel}</p>
          <div className="mt-4 space-y-3">
            {t.tasks.map((task) => (
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
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("full") ||
    normalized.includes("follow") ||
    normalized.includes("renew") ||
    normalized.includes("gia hạn") ||
    normalized.includes("cần")
      ? "orange"
      : normalized.includes("còn") ||
          normalized.includes("available") ||
          normalized.includes("active")
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
