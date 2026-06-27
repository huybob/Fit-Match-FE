"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, RefreshCw, UploadCloud, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import {
  useCreateTrainerAvailability,
  useCreateTrainerCertificate,
  useCreateTrainerService,
  useDeleteTrainerAvailability,
  useDeleteTrainerCertificate,
  useDeleteTrainerService,
  useEndTrainerPartnership,
  useGetMyTrainerProfile,
  useGetTrainerAvailability,
  useGetTrainerCertificates,
  useGetTrainerPartnerships,
  useGetTrainerServices,
  useRequestTrainerPartnership,
  useToggleTrainerService,
  useUpdateTrainerAvailability,
  useUpdateTrainerCertificate,
  useUpdateTrainerProfile,
  useUpdateTrainerService,
  useUploadTrainerAvatar,
} from "@/modules/trainer/hooks/use-trainer";
import {
  availabilitySchema,
  certificateSchema,
  partnershipSchema,
  trainerProfileSchema,
  trainerServiceSchema,
} from "@/modules/trainer/schemas";
import type {
  Availability,
  Certificate,
  TrainerService,
} from "@/services/trainer.service";
import { ConfirmDialog } from "@/shared/components/common/confirm-dialog";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { PageHeader } from "@/shared/components/common/page-header";
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

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const partnerStatusVariant: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

function fail(
  toast: ReturnType<typeof useToast>["toast"],
  error: unknown,
  title: string,
) {
  toast({
    type: "error",
    title,
    description: toErrorMessage(error),
  });
}

function timeText(value?: string | { hour?: number; minute?: number }) {
  if (typeof value === "string") return value.slice(0, 5);
  return value
    ? `${String(value.hour ?? 0).padStart(2, "0")}:${String(value.minute ?? 0).padStart(2, "0")}`
    : "";
}

function localTime(value: string) {
  return `${value}:00`;
}

const dayLabels: Record<number, string> = {
  0: "Thứ Hai",
  1: "Thứ Ba",
  2: "Thứ Tư",
  3: "Thứ Năm",
  4: "Thứ Sáu",
  5: "Thứ Bảy",
  6: "Chủ Nhật",
};

export function TrainerProfilePage() {
  const query = useGetMyTrainerProfile();
  const update = useUpdateTrainerProfile();
  const upload = useUploadTrainerAvatar();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof trainerProfileSchema>>({
    resolver: zodResolver(trainerProfileSchema),
    defaultValues: {
      bio: "",
      experienceYears: 0,
      pricePerHour: 1,
      pricePerSession: 1,
    },
  });
  useEffect(() => {
    if (query.data)
      form.reset({
        bio: query.data.bio ?? "",
        experienceYears: query.data.experienceYears ?? 0,
        pricePerHour: query.data.pricePerHour ?? 1,
        pricePerSession: query.data.pricePerSession ?? 1,
      });
  }, [form, query.data]);

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError)
    return (
      <EmptyState
        title="Không thể tải hồ sơ huấn luyện viên"
        description={toErrorMessage(query.error)}
      />
    );

  return (
    <>
      <PageHeader
        title="Hồ sơ huấn luyện viên"
        description="Cập nhật thông tin cá nhân và ảnh đại diện của bạn."
      />
      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
        <form
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await update.mutateAsync(values);
              toast({
                type: "success",
                title: "Cập nhật hồ sơ thành công",
              });
            } catch (error) {
              fail(toast, error, "Yêu cầu thất bại");
            }
          })}
        >
          <FieldShell
            label="Tiểu sử"
            error={form.formState.errors.bio}
          >
            <Textarea className="min-h-32" {...form.register("bio")} />
          </FieldShell>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldShell
              label="Số năm kinh nghiệm"
              error={form.formState.errors.experienceYears}
            >
              <Input
                type="number"
                {...form.register("experienceYears", { valueAsNumber: true })}
              />
            </FieldShell>
            <FieldShell
              label="Giá mỗi giờ"
              error={form.formState.errors.pricePerHour}
            >
              <Input
                type="number"
                {...form.register("pricePerHour", { valueAsNumber: true })}
              />
            </FieldShell>
            <FieldShell
              label="Giá mỗi buổi"
              error={form.formState.errors.pricePerSession}
            >
              <Input
                type="number"
                {...form.register("pricePerSession", { valueAsNumber: true })}
              />
            </FieldShell>
          </div>
          <Button disabled={update.isPending}>
            Lưu hồ sơ
          </Button>
        </form>
        <aside className="flex flex-col items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-zinc-950 to-zinc-800 p-7 text-center text-white shadow-sm">
          <div className="relative grid size-28 place-items-center rounded-full border-4 border-white/20 bg-primary text-2xl font-black text-zinc-950 shadow-xl">
            {query.data?.username?.slice(0, 2).toUpperCase() || (
              <UserRound className="size-10" />
            )}
          </div>
          <p className="mt-5 text-xl font-black">{query.data?.username}</p>
          <p className="mt-1 text-sm text-zinc-300">{query.data?.email}</p>
          <label
            className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-primary hover:shadow-lg"
            htmlFor="trainer-avatar"
          >
            <UploadCloud className="size-4" />
            Tải lên ảnh đại diện
            <input
              className="sr-only"
              id="trainer-avatar"
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  await upload.mutateAsync(file);
                  toast({
                    type: "success",
                    title: "Tải lên ảnh đại diện thành công",
                  });
                } catch (error) {
                  fail(toast, error, "Yêu cầu thất bại");
                }
              }}
            />
          </label>
        </aside>
      </div>
    </>
  );
}

export function TrainerServicesPage() {
  const query = useGetTrainerServices();
  const create = useCreateTrainerService();
  const update = useUpdateTrainerService();
  const toggle = useToggleTrainerService();
  const remove = useDeleteTrainerService();
  const { toast } = useToast();
  const [editing, setEditing] = useState<TrainerService | null>(null);
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof trainerServiceSchema>>({
    resolver: zodResolver(trainerServiceSchema),
    defaultValues: { name: "", description: "", price: 1, durationMinutes: 60 },
  });

  function show(service?: TrainerService) {
    setEditing(service ?? null);
    form.reset(
      service
        ? {
            name: service.name ?? "",
            description: service.description ?? "",
            price: service.price ?? 1,
            durationMinutes: service.durationMinutes ?? 60,
          }
        : { name: "", description: "", price: 1, durationMinutes: 60 },
    );
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Dịch vụ huấn luyện"
        description="Quản lý các dịch vụ bạn cung cấp cho học viên."
        action={
          <Button onClick={() => show()}>
            <Plus className="size-4" />
            Thêm dịch vụ
          </Button>
        }
      />
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data.content.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black">{item.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description || "Chưa có mô tả"}
                  </p>
                </div>
                <Badge variant={item.isActive ? "success" : "secondary"}>
                  {item.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                </Badge>
              </div>
              <p className="mt-4 font-black text-accent">
                {currency.format(item.price ?? 0)} · {item.durationMinutes}{" "}
                phút
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => show(item)}>Sửa</Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    item.id &&
                    toggle.mutate({ id: item.id, isActive: !item.isActive })
                  }
                >
                  <RefreshCw className="size-4" />
                  Đổi trạng thái
                </Button>
                {item.id && (
                  <ConfirmDialog
                    label="Xóa"
                    title="Xóa dịch vụ này?"
                    onConfirm={() => remove.mutate(item.id!)}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có dịch vụ nào"
          description="Hãy thêm dịch vụ đầu tiên của bạn."
        />
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa dịch vụ" : "Tạo dịch vụ mới"}
      >
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              if (editing?.id) {
                await update.mutateAsync({ id: editing.id, payload: values });
              } else {
                await create.mutateAsync(values);
              }
              toast({
                type: "success",
                title: editing
                  ? "Cập nhật dịch vụ thành công"
                  : "Tạo dịch vụ thành công",
              });
              setOpen(false);
            } catch (error) {
              fail(toast, error, "Yêu cầu thất bại");
            }
          })}
        >
          <FieldShell
            label="Tên"
            error={form.formState.errors.name}
          >
            <Input {...form.register("name")} />
          </FieldShell>
          <FieldShell
            label="Mô tả"
            error={form.formState.errors.description}
          >
            <Textarea className="min-h-24" {...form.register("description")} />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell
              label="Giá"
              error={form.formState.errors.price}
            >
              <Input
                type="number"
                {...form.register("price", { valueAsNumber: true })}
              />
            </FieldShell>
            <FieldShell
              label="Thời lượng (phút)"
              error={form.formState.errors.durationMinutes}
            >
              <Input
                type="number"
                {...form.register("durationMinutes", { valueAsNumber: true })}
              />
            </FieldShell>
          </div>
          <Button className="w-full">
            {editing ? "Cập nhật" : "Tạo mới"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}

export function TrainerAvailabilityPage() {
  const query = useGetTrainerAvailability();
  const create = useCreateTrainerAvailability();
  const update = useUpdateTrainerAvailability();
  const remove = useDeleteTrainerAvailability();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Availability | null>(null);
  const form = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      dayOfWeek: 0,
      startTime: "08:00",
      endTime: "09:00",
      isRecurring: true,
      effectiveDate: "",
    },
  });

  function edit(item?: Availability) {
    setEditing(item ?? null);
    form.reset(
      item
        ? {
            dayOfWeek: item.dayOfWeek ?? 0,
            startTime: timeText(item.startTime),
            endTime: timeText(item.endTime),
            isRecurring: item.isRecurring ?? true,
            effectiveDate: item.effectiveDate ?? "",
          }
        : {
            dayOfWeek: 0,
            startTime: "08:00",
            endTime: "09:00",
            isRecurring: true,
            effectiveDate: "",
          },
    );
  }

  return (
    <>
      <PageHeader
        title="Lịch rảnh"
        description="Quản lý các khung giờ bạn có thể nhận lịch tập."
      />
      <form
        className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-5 md:grid-cols-5"
        onSubmit={form.handleSubmit(async (values) => {
          const payload = {
            dayOfWeek: values.dayOfWeek,
            startTime: localTime(values.startTime),
            endTime: localTime(values.endTime),
            isRecurring: values.isRecurring,
            effectiveDate: values.effectiveDate || undefined,
          };
          try {
            if (editing?.id) {
              await update.mutateAsync({ id: editing.id, payload });
            } else {
              await create.mutateAsync(payload);
            }
            toast({
              type: "success",
              title: editing
                ? "Cập nhật lịch rảnh thành công"
                : "Thêm lịch rảnh thành công",
            });
            edit();
          } catch (error) {
            fail(toast, error, "Yêu cầu thất bại");
          }
        })}
      >
        <Controller
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {days.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {dayLabels[index] ?? day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Input
          aria-label="Giờ bắt đầu"
          type="time"
          {...form.register("startTime")}
        />
        <Input
          aria-label="Giờ kết thúc"
          type="time"
          {...form.register("endTime")}
        />
        <Controller
          control={form.control}
          name="effectiveDate"
          render={({ field }) => (
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              placeholder="Ngày hiệu lực"
            />
          )}
        />
        <Button>
          {editing ? "Cập nhật" : "Thêm khung giờ"}
        </Button>
      </form>
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.content.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h2 className="font-black">
                {dayLabels[item.dayOfWeek ?? 0] ?? days[item.dayOfWeek ?? 0]}
              </h2>
              <p className="mt-2">
                {timeText(item.startTime)}–{timeText(item.endTime)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.isRecurring ? "Định kỳ" : item.effectiveDate}
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => edit(item)}>Sửa</Button>
                {item.id && (
                  <ConfirmDialog
                    label="Xóa"
                    title="Xóa khung giờ này?"
                    onConfirm={() => remove.mutate(item.id!)}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có lịch rảnh"
          description="Hãy thêm khung giờ rảnh đầu tiên của bạn."
        />
      )}
    </>
  );
}

export function TrainerCertificatesPage() {
  const query = useGetTrainerCertificates();
  const create = useCreateTrainerCertificate();
  const update = useUpdateTrainerCertificate();
  const remove = useDeleteTrainerCertificate();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof certificateSchema>>({
    resolver: zodResolver(certificateSchema),
    defaultValues: { name: "", issuingOrg: "", issueDate: "", expiryDate: "" },
  });

  function show(item?: Certificate) {
    setEditing(item ?? null);
    setFiles([]);
    form.reset(
      item
        ? {
            name: item.name ?? "",
            issuingOrg: item.issuingOrg ?? "",
            issueDate: item.issueDate ?? "",
            expiryDate: item.expiryDate ?? "",
          }
        : { name: "", issuingOrg: "", issueDate: "", expiryDate: "" },
    );
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Chứng chỉ"
        description="Quản lý các chứng chỉ và bằng cấp của bạn."
        action={
          <Button onClick={() => show()}>
            <Plus className="size-4" />
            Thêm chứng chỉ
          </Button>
        }
      />
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data.content.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h2 className="font-black">{item.name}</h2>
              <p className="text-sm text-muted-foreground">{item.issuingOrg}</p>
              <p className="mt-3 text-xs font-bold">
                {item.issueDate || "Chưa có ngày cấp"} →{" "}
                {item.expiryDate || "Không hết hạn"}
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => show(item)}>Sửa</Button>
                {item.id && (
                  <ConfirmDialog
                    label="Xóa"
                    title="Xóa chứng chỉ này?"
                    onConfirm={() => remove.mutate(item.id!)}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có chứng chỉ nào"
          description="Hãy thêm chứng chỉ đầu tiên của bạn."
        />
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa chứng chỉ" : "Thêm chứng chỉ"}
      >
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            const payload = {
              ...values,
              issueDate: values.issueDate || undefined,
              expiryDate: values.expiryDate || undefined,
            };
            try {
              if (editing?.id) {
                await update.mutateAsync({ id: editing.id, payload, files });
              } else {
                await create.mutateAsync({ payload, files });
              }
              toast({
                type: "success",
                title: editing
                  ? "Cập nhật chứng chỉ thành công"
                  : "Thêm chứng chỉ thành công",
              });
              setOpen(false);
            } catch (error) {
              fail(toast, error, "Yêu cầu thất bại");
            }
          })}
        >
          <FieldShell
            label="Tên"
            error={form.formState.errors.name}
          >
            <Input {...form.register("name")} />
          </FieldShell>
          <FieldShell
            label="Tổ chức cấp"
            error={form.formState.errors.issuingOrg}
          >
            <Input {...form.register("issuingOrg")} />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Ngày cấp"
                />
              )}
            />
            <Controller
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Ngày hết hạn"
                />
              )}
            />
          </div>
          <label
            className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border px-4 py-3 text-sm font-bold transition hover:border-primary hover:bg-primary/5"
            htmlFor="certificate-files"
          >
            <span>Tệp đính kèm</span>
            <UploadCloud className="size-4" />
            <input
              className="sr-only"
              id="certificate-files"
              multiple
              type="file"
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
            />
          </label>
          <Button className="w-full">
            Lưu chứng chỉ
          </Button>
        </form>
      </Dialog>
    </>
  );
}

export function TrainerPartnershipsPage() {
  const query = useGetTrainerPartnerships();
  const request = useRequestTrainerPartnership();
  const end = useEndTrainerPartnership();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof partnershipSchema>>({
    resolver: zodResolver(partnershipSchema),
    defaultValues: { gymId: 0, requestMessage: "" },
  });

  return (
    <>
      <PageHeader
        title="Hợp tác phòng gym"
        description="Quản lý các yêu cầu và quan hệ hợp tác với phòng gym."
      />
      <form
        className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-[180px_1fr_auto]"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await request.mutateAsync(values);
            form.reset();
            toast({
              type: "success",
              title: "Gửi yêu cầu hợp tác thành công",
            });
          } catch (error) {
            fail(toast, error, "Yêu cầu thất bại");
          }
        })}
      >
        <Input
          aria-label="Mã phòng gym"
          min="1"
          placeholder="Mã phòng gym"
          type="number"
          {...form.register("gymId", { valueAsNumber: true })}
        />
        <Input
          aria-label="Lời nhắn gửi phòng gym"
          placeholder="Lời nhắn gửi phòng gym"
          {...form.register("requestMessage")}
        />
        <Button>Gửi yêu cầu</Button>
      </form>
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="space-y-3">
          {query.data.content.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-black">
                  {item.gymName || `Phòng gym #${item.gymId}`}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.requestMessage || "Không có nội dung"}
                </p>
                <Badge
                  className="mt-3"
                  variant={
                    partnerStatusVariant[String(item.status)] ?? "default"
                  }
                >
                  {({ active: "Đang hoạt động", inactive: "Ngừng hoạt động", pending: "Đang chờ", approved: "Đã chấp nhận", rejected: "Đã từ chối", ended: "Đã kết thúc", confirmed: "Đã xác nhận", completed: "Hoàn thành", cancelled: "Đã hủy" })[String(item.status).toLowerCase()] ?? item.status}
                </Badge>
              </div>
              {item.id && item.status === "APPROVED" && (
                <ConfirmDialog
                  label="Kết thúc hợp tác"
                  title="Kết thúc hợp tác với phòng gym này?"
                  onConfirm={() => end.mutate(item.id!)}
                />
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có hợp tác nào"
          description="Hãy gửi yêu cầu hợp tác với phòng gym đầu tiên."
        />
      )}
    </>
  );
}
