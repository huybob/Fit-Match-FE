"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  CalendarClock,
  Flame,
  MessageSquareText,
  Plus,
  Star,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import type { TrainingSession } from "@/services/training-session.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { PageHeader } from "@/shared/components/common/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useCreateTrainingSession,
  useSubmitSessionFeedback,
  useTrainingSessions,
  useUpdateTrainingSession,
} from "../hooks/use-training-session";
import { feedbackSchema, sessionSchema, updateSessionSchema } from "../schemas";

function when(value: string | undefined) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

function duration(session: TrainingSession) {
  if (!session.actualStartTime || !session.actualEndTime) return undefined;
  return Math.max(
    0,
    Math.round(
      (new Date(session.actualEndTime).getTime() -
        new Date(session.actualStartTime).getTime()) /
        60000,
    ),
  );
}

export function TrainingSessionsPage({ scope }: { scope: "customer" | "pt" }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<TrainingSession | null>(null);
  const [creating, setCreating] = useState(false);
  const query = useTrainingSessions(scope, page);
  const items = query.data?.content ?? [];

  const scopeTitles: Record<string, string> = {
    customer: "Buổi tập của tôi",
    pt: "Quản lý buổi tập",
  };
  const scopeDescriptions: Record<string, string> = {
    customer: "Xem lịch sử và chi tiết các buổi tập của bạn.",
    pt: "Quản lý và cập nhật thông tin các buổi tập với học viên.",
  };

  return (
    <div>
      <PageHeader
        title={scopeTitles[scope] ?? "Buổi tập"}
        description={scopeDescriptions[scope] ?? ""}
        action={
          scope === "pt" ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Tạo buổi tập
            </Button>
          ) : undefined
        }
      />

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title="Không thể tải dữ liệu"
          description={toErrorMessage(query.error)}
        />
      ) : !items.length ? (
        <EmptyState
          title="Chưa có buổi tập nào"
          description="Chưa có buổi tập nào được ghi nhận."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSelected(session)}
              className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                    #{session.id}
                    {session.bookingId ? ` · Booking #${session.bookingId}` : ""}
                  </p>
                  <h2 className="mt-1 text-lg font-black group-hover:text-accent">
                    {session.workoutPlanName ?? "Buổi tập tự do"}
                  </h2>
                </div>
                {session.rating ? (
                  <Badge variant="warning">
                    <Star className="size-3 fill-current" />
                    {session.rating}/5
                  </Badge>
                ) : (
                  <Badge variant={session.actualEndTime ? "success" : "info"}>
                    {session.actualEndTime ? "Đã hoàn thành" : "Đang diễn ra"}
                  </Badge>
                )}
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <UserRound className="size-4 text-primary" />
                  {scope === "pt" ? session.customerName : session.ptName}
                </span>
                <span className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-accent" />
                  {when(session.actualStartTime)}
                </span>
                <span className="flex items-center gap-2">
                  <Activity className="size-4 text-blue-500" />
                  {duration(session) !== undefined
                    ? `${duration(session)} phút`
                    : "Chưa kết thúc"}
                </span>
                <span className="flex items-center gap-2">
                  <Flame className="size-4 text-destructive" />
                  {session.caloriesBurned ?? 0} kcal
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
            Trang trước
          </Button>
          <span className="text-sm font-bold">
            {page + 1} / {query.data?.totalPages}
          </span>
          <Button
            disabled={query.data?.last}
            onClick={() => setPage((v) => v + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}

      <SessionDetailDialog
        session={selected}
        scope={scope}
        onClose={() => setSelected(null)}
      />
      <CreateSessionDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function SessionDetailDialog({
  session,
  scope,
  onClose,
}: {
  session: TrainingSession | null;
  scope: "customer" | "pt";
  onClose: () => void;
}) {
  const { toast } = useToast();
  const update = useUpdateTrainingSession();
  const feedback = useSubmitSessionFeedback();
  const updateForm = useForm<z.infer<typeof updateSessionSchema>>({
    resolver: zodResolver(updateSessionSchema),
    values: {
      actualStartTime: session?.actualStartTime?.slice(0, 16) ?? "",
      actualEndTime: session?.actualEndTime?.slice(0, 16) ?? "",
      notes: session?.notes ?? "",
      caloriesBurned: session?.caloriesBurned,
    },
  });
  const feedbackForm = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    values: {
      feedback: session?.feedback ?? "",
      rating: session?.rating ?? 5,
    },
  });

  if (!session) return null;

  return (
    <Dialog open title="Chi tiết buổi tập" onClose={onClose}>
      <div className="rounded-2xl bg-muted/50 p-5">
        <h3 className="text-xl font-black">
          {session.workoutPlanName ?? "Buổi tập tự do"}
        </h3>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Info label="Học viên" value={session.customerName} />
          <Info label="Huấn luyện viên" value={session.ptName} />
          <Info
            label="Thời gian bắt đầu"
            value={when(session.actualStartTime)}
          />
          <Info
            label="Thời gian kết thúc"
            value={when(session.actualEndTime)}
          />
        </dl>
      </div>

      {scope === "pt" ? (
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={updateForm.handleSubmit(async (values) => {
            if (!session.id) return;
            try {
              await update.mutateAsync({
                id: session.id,
                payload: {
                  actualStartTime: values.actualStartTime || undefined,
                  actualEndTime: values.actualEndTime || undefined,
                  notes: values.notes || undefined,
                  caloriesBurned: values.caloriesBurned,
                },
              });
              toast({ type: "success", title: "Đã cập nhật buổi tập" });
              onClose();
            } catch (error) {
              toast({
                type: "error",
                title: "Yêu cầu thất bại",
                description: toErrorMessage(error),
              });
            }
          })}
        >
          <FieldShell label="Thời gian bắt đầu">
            <Input
              type="datetime-local"
              {...updateForm.register("actualStartTime")}
            />
          </FieldShell>
          <FieldShell label="Thời gian kết thúc">
            <Input
              type="datetime-local"
              {...updateForm.register("actualEndTime")}
            />
          </FieldShell>
          <FieldShell label="Calo tiêu thụ">
            <Input
              type="number"
              min={0}
              {...updateForm.register("caloriesBurned", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number(value),
              })}
            />
          </FieldShell>
          <div className="sm:col-span-2">
            <FieldShell label="Ghi chú">
              <Textarea className="min-h-24" {...updateForm.register("notes")} />
            </FieldShell>
          </div>
          <Button className="sm:col-span-2" disabled={update.isPending}>
            Lưu thay đổi
          </Button>
        </form>
      ) : (
        <form
          className="mt-5 space-y-4"
          onSubmit={feedbackForm.handleSubmit(async (values) => {
            if (!session.id) return;
            try {
              await feedback.mutateAsync({ id: session.id, payload: values });
              toast({ type: "success", title: "Đã gửi đánh giá" });
              onClose();
            } catch (error) {
              toast({
                type: "error",
                title: "Yêu cầu thất bại",
                description: toErrorMessage(error),
              });
            }
          })}
        >
          <FieldShell label="Đánh giá">
            <Controller
              control={feedbackForm.control}
              name="rating"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((v) => (
                      <SelectItem key={v} value={String(v)}>{v}/5</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FieldShell>
          <FieldShell label="Nhận xét">
            <Textarea
              className="min-h-28"
              maxLength={1000}
              {...feedbackForm.register("feedback")}
            />
          </FieldShell>
          <Button disabled={feedback.isPending}>
            <MessageSquareText className="size-4" />
            Gửi đánh giá
          </Button>
        </form>
      )}
    </Dialog>
  );
}

function CreateSessionDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const create = useCreateTrainingSession();
  const form = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      customerId: 0,
      workoutPlanId: undefined,
      actualStartTime: "",
      actualEndTime: "",
      notes: "",
    },
  });

  return (
    <Dialog open={open} title="Tạo buổi tập" onClose={onClose}>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await create.mutateAsync({
              customerId: values.customerId,
              workoutPlanId: values.workoutPlanId,
              actualStartTime: values.actualStartTime || undefined,
              actualEndTime: values.actualEndTime || undefined,
              notes: values.notes || undefined,
            });
            toast({ type: "success", title: "Đã tạo buổi tập" });
            form.reset();
            onClose();
          } catch (error) {
            toast({
              type: "error",
              title: "Yêu cầu thất bại",
              description: toErrorMessage(error),
            });
          }
        })}
      >
        <FieldShell
          label="ID học viên"
          error={form.formState.errors.customerId}
        >
          <Input
            type="number"
            min={1}
            {...form.register("customerId", { valueAsNumber: true })}
          />
        </FieldShell>
        <FieldShell
          label="ID giáo án"
          error={form.formState.errors.workoutPlanId}
        >
          <Input
            type="number"
            min={1}
            {...form.register("workoutPlanId", {
              setValueAs: (value) =>
                value === "" ? undefined : Number(value),
            })}
          />
        </FieldShell>
        <FieldShell label="Thời gian bắt đầu">
          <Input type="datetime-local" {...form.register("actualStartTime")} />
        </FieldShell>
        <FieldShell label="Thời gian kết thúc">
          <Input type="datetime-local" {...form.register("actualEndTime")} />
        </FieldShell>
        <div className="sm:col-span-2">
          <FieldShell label="Ghi chú">
            <Textarea className="min-h-24" {...form.register("notes")} />
          </FieldShell>
        </div>
        <Button className="sm:col-span-2" disabled={create.isPending}>
          {create.isPending ? "Đang xử lý..." : "Tạo buổi tập"}
        </Button>
      </form>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-bold">{value || "—"}</dd>
    </div>
  );
}
