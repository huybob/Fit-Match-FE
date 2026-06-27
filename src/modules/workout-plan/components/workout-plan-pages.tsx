"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import type { WorkoutPlan, WorkoutPlanStatus } from "@/services/workout-plan.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DatePicker } from "@/shared/components/ui/date-picker";
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
  useSaveWorkoutPlan,
  useWorkoutPlanAction,
  useWorkoutPlans,
} from "../hooks/use-workout-plan";
import { workoutPlanSchema } from "../schemas";

const statuses: WorkoutPlanStatus[] = ["ACTIVE", "COMPLETED", "ARCHIVED"];

const statusVariant: Record<
  WorkoutPlanStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  ACTIVE: "success",
  COMPLETED: "info",
  ARCHIVED: "secondary",
};

const workoutPlanStatusLabels: Record<WorkoutPlanStatus, string> = {
  ACTIVE: "Đang hoạt động",
  COMPLETED: "Hoàn thành",
  ARCHIVED: "Đã lưu trữ",
};

const scopeTitles: Record<"customer" | "pt", string> = {
  customer: "Giáo án của tôi",
  pt: "Quản lý giáo án",
};

const scopeDescriptions: Record<"customer" | "pt", string> = {
  customer: "Xem các giáo án tập luyện được huấn luyện viên giao cho bạn.",
  pt: "Tạo và quản lý giáo án tập luyện cho học viên của bạn.",
};

const actionSuccessLabels: Record<"complete" | "archive", string> = {
  complete: "Đã hoàn thành giáo án",
  archive: "Đã lưu trữ giáo án",
};

export function WorkoutPlansPage({ scope }: { scope: "customer" | "pt" }) {
  const [status, setStatus] = useState<WorkoutPlanStatus | "">("");
  const [editing, setEditing] = useState<WorkoutPlan | null | undefined>();
  const query = useWorkoutPlans(scope, status || undefined);
  const action = useWorkoutPlanAction();
  const { toast } = useToast();

  async function run(id: number, next: "complete" | "archive") {
    try {
      await action.mutateAsync({ id, action: next });
      toast({ type: "success", title: actionSuccessLabels[next] });
    } catch (error) {
      toast({
        type: "error",
        title: "Yêu cầu thất bại",
        description: toErrorMessage(error),
      });
    }
  }

  return (
    <div>
      <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{scopeTitles[scope]}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {scopeDescriptions[scope]}
          </p>
        </div>
        {scope === "pt" && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            Tạo giáo án
          </Button>
        )}
      </section>

      <Select
        value={status}
        onValueChange={(v) => setStatus(v as WorkoutPlanStatus | "")}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tất cả trạng thái</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {workoutPlanStatusLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState
            title="Không thể tải giáo án"
            description={toErrorMessage(query.error)}
          />
        ) : !query.data?.content?.length ? (
          <EmptyState
            title="Chưa có giáo án"
            description="Chưa có giáo án nào được tạo."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {query.data.content.map((plan) => (
              <article
                key={plan.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground">
                      {scope === "pt" ? plan.customerName : plan.ptName}
                    </p>
                    <h2 className="mt-1 text-xl font-black">{plan.name}</h2>
                  </div>
                  <Badge
                    variant={
                      plan.status
                        ? (statusVariant[plan.status] ?? "default")
                        : "default"
                    }
                  >
                    {plan.status
                      ? (workoutPlanStatusLabels[plan.status] ?? "—")
                      : "—"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {plan.description || "Chưa có mô tả"}
                </p>
                <p className="mt-4 text-sm font-bold">
                  {plan.startDate} → {plan.endDate} ·{" "}
                  {plan.exercises?.length ?? 0} bài tập
                </p>
                {scope === "pt" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => setEditing(plan)}>
                      Sửa
                    </Button>
                    {plan.status === "ACTIVE" && (
                      <>
                        <Button onClick={() => void run(plan.id!, "complete")}>
                          Hoàn thành
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => void run(plan.id!, "archive")}
                        >
                          Lưu trữ
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {editing !== undefined && (
        <WorkoutPlanDialog
          plan={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}

function WorkoutPlanDialog({
  plan,
  onClose,
}: {
  plan: WorkoutPlan | null;
  onClose: () => void;
}) {
  const save = useSaveWorkoutPlan();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof workoutPlanSchema>>({
    resolver: zodResolver(workoutPlanSchema),
    defaultValues: {
      customerId: plan?.customerId ?? 0,
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      startDate: plan?.startDate ?? "",
      endDate: plan?.endDate ?? "",
      exercises: plan?.exercises?.length
        ? plan.exercises.map((e) => ({ ...e }))
        : [{ name: "", sets: 1, reps: 1, weight: "", notes: "" }],
    },
  });

  return (
    <Dialog
      open
      title={plan ? "Sửa giáo án" : "Tạo giáo án"}
      onClose={onClose}
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await save.mutateAsync({ id: plan?.id, payload: values });
            toast({ type: "success", title: "Đã lưu giáo án" });
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
            {...form.register("customerId", { valueAsNumber: true })}
          />
        </FieldShell>
        <FieldShell
          label="Tên giáo án"
          error={form.formState.errors.name}
        >
          <Input {...form.register("name")} />
        </FieldShell>
        <FieldShell label="Ngày bắt đầu">
          <Controller
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FieldShell>
        <FieldShell
          label="Ngày kết thúc"
          error={form.formState.errors.endDate}
        >
          <Controller
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FieldShell>
        <div className="sm:col-span-2">
          <FieldShell label="Mô tả">
            <Textarea {...form.register("description")} />
          </FieldShell>
        </div>
        <div className="sm:col-span-2 rounded-xl border border-border p-4">
          <p className="mb-3 font-black">Bài tập đầu tiên</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Tên bài tập"
              {...form.register("exercises.0.name")}
            />
            <Input
              type="number"
              placeholder="Số hiệp"
              {...form.register("exercises.0.sets", { valueAsNumber: true })}
            />
            <Input
              type="number"
              placeholder="Số lần"
              {...form.register("exercises.0.reps", { valueAsNumber: true })}
            />
          </div>
        </div>
        <Button className="sm:col-span-2" disabled={save.isPending}>
          <ClipboardList className="size-4" />
          Lưu thay đổi
        </Button>
      </form>
    </Dialog>
  );
}
