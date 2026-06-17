"use client";

import Link from "next/link";
import {
  AppWindow,
  ArrowRight,
  Award,
  BarChart3,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  LineChart,
  Menu,
  MessageSquareQuote,
  QrCode,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection } from "./animated-section";
import { DashboardMockup } from "./dashboard-mockup";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn.util";

const navigation = [
  { label: "Tính năng", href: "#features" },
  { label: "PT", href: "#pt" },
  { label: "Booking", href: "#booking" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const stats = [
  { value: "1000+", label: "phòng gym" },
  { value: "100.000+", label: "hội viên" },
  { value: "1 triệu+", label: "lượt booking" },
  { value: "99.9%", label: "uptime" },
];

const features = [
  { title: "Quản lý hội viên", icon: UsersRound },
  { title: "Quản lý gói tập", icon: CreditCard },
  { title: "Quản lý PT", icon: UserCheck },
  { title: "Booking lịch tập", icon: CalendarClock },
  { title: "Check-in QR Code", icon: QrCode },
  { title: "Theo dõi tiến độ tập luyện", icon: TrendingUp },
  { title: "Quản lý doanh thu", icon: BarChart3 },
  { title: "Báo cáo thống kê", icon: LineChart },
  { title: "Mobile App cho hội viên", icon: Smartphone },
  { title: "Quản lý nhiều chi nhánh", icon: Building2 },
];

const modules = [
  {
    id: "pt",
    eyebrow: "Module quản lý PT",
    title: "Tối ưu lịch làm việc, booking và hoa hồng cho từng huấn luyện viên",
    description:
      "Tập trung mọi dữ liệu PT vào một màn hình: năng lực, lịch rảnh, doanh số, đánh giá và tỷ lệ giữ chân học viên.",
    icon: Dumbbell,
    accent: "emerald",
    items: [
      "Hồ sơ PT",
      "Chứng chỉ",
      "Lịch làm việc",
      "Booking PT",
      "Hoa hồng PT",
      "Đánh giá PT",
    ],
  },
  {
    id: "members",
    eyebrow: "Module hội viên",
    title: "Hiểu từng hội viên để tăng gia hạn và giảm churn",
    description:
      "Theo dõi vòng đời hội viên từ đăng ký, check-in, chỉ số cơ thể đến gia hạn gói tập trên cùng một hồ sơ.",
    icon: UsersRound,
    accent: "orange",
    items: [
      "Hồ sơ thành viên",
      "Gia hạn gói tập",
      "Theo dõi lịch sử tập",
      "Theo dõi chỉ số cơ thể",
      "Điểm danh QR",
    ],
  },
  {
    id: "booking",
    eyebrow: "Module Booking",
    title: "Lấp đầy lớp học và lịch PT với luồng đặt lịch mượt mà",
    description:
      "Booking realtime, tự động nhắc lịch, hủy lịch có kiểm soát và đồng bộ Google Calendar cho nhân sự vận hành.",
    icon: CalendarClock,
    accent: "zinc",
    items: [
      "Đặt lịch lớp học",
      "Đặt lịch PT",
      "Hủy lịch",
      "Nhắc lịch tự động",
      "Đồng bộ Google Calendar",
    ],
  },
];

const workflow = [
  "Đăng ký phòng gym",
  "Tạo gói tập",
  "Quản lý hội viên",
  "Đặt lịch và check-in",
  "Theo dõi doanh thu",
];

const pricing = [
  {
    name: "Starter",
    price: "1.490.000đ",
    description: "Cho studio mới bắt đầu số hóa vận hành.",
    members: "300 hội viên",
    trainers: "5 PT",
    branches: "1 chi nhánh",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "3.990.000đ",
    description: "Cho phòng gym đang tăng trưởng nhanh.",
    members: "2.000 hội viên",
    trainers: "30 PT",
    branches: "3 chi nhánh",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Liên hệ",
    description: "Cho chuỗi fitness cần vận hành tập trung.",
    members: "Không giới hạn",
    trainers: "Không giới hạn PT",
    branches: "Không giới hạn chi nhánh",
    highlighted: false,
  },
];

const testimonials = [
  {
    quote:
      "FitMatch giúp đội lễ tân giảm gần một nửa thời gian xử lý booking giờ cao điểm. Dữ liệu hội viên và PT rõ ràng hơn rất nhiều.",
    name: "Nguyễn Minh Khôi",
    role: "Founder, Pulse Gym",
  },
  {
    quote:
      "Từ khi dùng QR check-in và nhắc lịch tự động, tỷ lệ vắng lớp giảm rõ rệt. Dashboard doanh thu cũng rất dễ đọc cho quản lý chi nhánh.",
    name: "Trần Hoài An",
    role: "Operations Manager, ActiveFit",
  },
  {
    quote:
      "Module hoa hồng PT là phần chúng tôi thích nhất. Cuối tháng không còn phải đối soát thủ công bằng nhiều file riêng lẻ.",
    name: "Lê Quốc Huy",
    role: "CEO, Titan Fitness",
  },
];

const faqs = [
  {
    question: "Có hỗ trợ nhiều chi nhánh không?",
    answer:
      "Có. Professional hỗ trợ nhiều chi nhánh, Enterprise hỗ trợ vận hành chuỗi với phân quyền và báo cáo tập trung.",
  },
  {
    question: "Có app mobile không?",
    answer:
      "Có app mobile cho hội viên để xem gói tập, đặt lịch, nhận nhắc lịch và theo dõi tiến độ tập luyện.",
  },
  {
    question: "Có quản lý PT không?",
    answer:
      "Có đầy đủ hồ sơ PT, chứng chỉ, lịch làm việc, booking, hoa hồng và đánh giá sau buổi tập.",
  },
  {
    question: "Có tích hợp QR Check-in không?",
    answer:
      "Có. Hội viên có thể check-in bằng QR, dữ liệu được đồng bộ realtime về dashboard vận hành.",
  },
  {
    question: "Có dùng thử miễn phí không?",
    answer:
      "Có. Bạn có thể dùng thử miễn phí để trải nghiệm luồng hội viên, booking, PT và dashboard quản trị.",
  },
];

const footerLinks = ["Giới thiệu", "Tính năng", "Bảng giá", "Liên hệ", "Chính sách bảo mật"];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ModulesSection />
      <DashboardSection />
      <WorkflowSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-zinc-950 text-white">
            <Dumbbell className="size-4" />
          </span>
          <span className="text-base font-bold tracking-tight">FitMatch</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="#pricing"
            className="text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
          >
            Bảng giá
          </Link>
          <Link
            href="#cta"
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Dùng thử miễn phí
          </Link>
        </div>

        <Button
          aria-label="Mở menu"
          className="size-10 rounded-md bg-zinc-100 p-0 text-zinc-950 shadow-none hover:bg-zinc-200 md:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#f4f4f5_100%)] px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            SaaS vận hành gym, fitness, PT và booking
          </Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
            Quản lý phòng Gym & Fitness toàn diện
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
            Quản lý hội viên, PT, lịch tập, gói tập và booking chỉ trên một nền tảng.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#pricing"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Dùng thử miễn phí
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#cta"
              className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-sm font-bold text-zinc-950 transition hover:bg-zinc-50"
            >
              Đặt lịch demo
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-600">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Onboarding trong 7 ngày
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              Dữ liệu bảo mật
            </span>
          </div>
        </motion.div>

        <DashboardMockup />
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <AnimatedSection className="bg-zinc-950 py-10 lg:py-12">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 p-6">
            <p className="text-3xl font-bold tracking-tight text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </AnimatedSection>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold uppercase text-emerald-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-7 text-zinc-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <AnimatedSection id="features">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Tính năng chính"
          title="Một hệ điều hành vận hành cho phòng gym hiện đại"
          description="Từ bán gói tập, xếp lịch PT đến báo cáo doanh thu, mọi workflow quan trọng đều nằm trong một nền tảng."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="group border-zinc-200 p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-zinc-950/5"
              >
                <div className="flex size-11 items-center justify-center rounded-md bg-zinc-100 text-zinc-800 transition group-hover:bg-emerald-500 group-hover:text-zinc-950">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-zinc-950">
                  {feature.title}
                </h3>
              </Card>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

function ModulesSection() {
  return (
    <div className="border-y border-zinc-200 bg-zinc-50">
      {modules.map((module, index) => {
        const Icon = module.icon;

        return (
          <AnimatedSection
            id={module.id}
            key={module.id}
            className={cn(index > 0 && "border-t border-zinc-200")}
          >
            <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
              <div className={cn(index % 2 === 1 && "lg:order-2")}>
                <Badge
                  className={cn(
                    module.accent === "orange" &&
                      "border-orange-200 bg-orange-50 text-orange-700",
                    module.accent === "emerald" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {module.eyebrow}
                </Badge>
                <h2 className="mt-5 text-3xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
                  {module.title}
                </h2>
                <p className="mt-5 text-lg leading-8 text-zinc-600">
                  {module.description}
                </p>
              </div>

              <Card className="overflow-hidden border-zinc-200">
                <CardHeader className="border-b border-zinc-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-md bg-zinc-950 text-white">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        {module.eyebrow}
                      </p>
                      <p className="text-xs text-zinc-500">Realtime workspace</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
                  {module.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-4"
                    >
                      <Check className="size-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-zinc-800">
                        {item}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </AnimatedSection>
        );
      })}
    </div>
  );
}

function DashboardSection() {
  return (
    <AnimatedSection>
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Dashboard Preview"
          title="Ra quyết định nhanh từ dữ liệu vận hành mỗi ngày"
          description="Theo dõi hội viên, lịch PT, doanh thu tháng, booking trong ngày và tỷ lệ gia hạn trong một dashboard trực quan."
        />
        <DashboardMockup compact className="mt-12" />
      </div>
    </AnimatedSection>
  );
}

function WorkflowSection() {
  return (
    <AnimatedSection className="border-y border-zinc-200 bg-zinc-950">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase text-emerald-400">
            Quy trình hoạt động
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Từ đăng ký đến báo cáo doanh thu chỉ trong 5 bước
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {workflow.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-emerald-500 text-sm font-bold text-zinc-950">
                {index + 1}
              </span>
              <p className="mt-5 text-base font-bold text-white">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function PricingSection() {
  return (
    <AnimatedSection id="pricing">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Bảng giá"
          title="Chọn gói phù hợp với quy mô vận hành"
          description="Giá theo tháng, dễ mở rộng khi số hội viên, PT và chi nhánh tăng trưởng."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricing.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative p-6",
                plan.highlighted &&
                  "border-emerald-400 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20",
              )}
            >
              {plan.highlighted && (
                <span className="absolute right-5 top-5 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-zinc-950">
                  Phổ biến
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p
                className={cn(
                  "mt-3 text-sm leading-6 text-zinc-600",
                  plan.highlighted && "text-zinc-300",
                )}
              >
                {plan.description}
              </p>
              <div className="mt-6">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                {plan.price !== "Liên hệ" && (
                  <span
                    className={cn(
                      "text-sm font-medium text-zinc-500",
                      plan.highlighted && "text-zinc-400",
                    )}
                  >
                    /tháng
                  </span>
                )}
              </div>
              <div className="mt-7 space-y-3">
                {[plan.members, plan.trainers, plan.branches].map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm font-medium">
                    <Check className="size-4 text-emerald-500" />
                    {item}
                  </p>
                ))}
              </div>
              <Link
                href="#cta"
                className={cn(
                  "mt-8 inline-flex h-11 w-full items-center justify-center rounded-md border border-zinc-300 text-sm font-bold transition hover:bg-zinc-50",
                  plan.highlighted &&
                    "border-emerald-400 bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
                )}
              >
                Dùng thử miễn phí
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function TestimonialsSection() {
  return (
    <AnimatedSection className="border-y border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Testimonials"
          title="Được tin dùng bởi các đội vận hành fitness tăng trưởng nhanh"
          description="Những phản hồi từ chủ phòng gym, quản lý vận hành và CEO chuỗi fitness."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="p-6">
              <div className="flex gap-1 text-orange-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-4 fill-current" />
                ))}
              </div>
              <MessageSquareQuote className="mt-6 size-7 text-zinc-400" />
              <p className="mt-4 text-base leading-7 text-zinc-700">
                “{testimonial.quote}”
              </p>
              <div className="mt-6 border-t border-zinc-100 pt-5">
                <p className="font-bold text-zinc-950">{testimonial.name}</p>
                <p className="text-sm text-zinc-500">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function FAQSection() {
  return (
    <AnimatedSection id="faq">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
            Câu hỏi thường gặp
          </h2>
          <p className="mt-5 text-lg leading-8 text-zinc-600">
            Những điểm quan trọng trước khi chuyển đổi số vận hành phòng gym.
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.question} className="p-5">
              <h3 className="text-base font-bold text-zinc-950">{faq.question}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function FinalCTASection() {
  return (
    <section
      id="cta"
      className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg bg-zinc-950 px-6 py-14 text-center shadow-2xl shadow-zinc-950/20 sm:px-10 lg:py-20">
        <Award className="mx-auto size-10 text-emerald-400" />
        <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Chuyển đổi số phòng Gym của bạn ngay hôm nay
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
          Bắt đầu quản lý hội viên, PT, booking và doanh thu trên một nền tảng vận hành hiện đại.
        </p>
        <Link
          href="#pricing"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-400 px-6 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300"
        >
          Dùng thử miễn phí
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-zinc-950 text-white">
            <AppWindow className="size-4" />
          </span>
          <span className="font-bold tracking-tight">FitMatch</span>
        </Link>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {footerLinks.map((link) => (
            <Link
              key={link}
              href="#"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
            >
              {link}
            </Link>
          ))}
        </div>
        <p className="text-sm text-zinc-500">© 2026 FitMatch. All rights reserved.</p>
      </div>
    </footer>
  );
}
