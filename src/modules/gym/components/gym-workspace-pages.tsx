"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Activity,
  Building2,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Plus,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import {
  useCreateBranch,
  useCreateFacility,
  useCreateGym,
  useDeleteBranch,
  useDeleteFacility,
  useGymBranches,
  useGymDetail,
  useGymFacilities,
  useGymPartnerships,
  useMyGyms,
  usePartnershipAction,
  useSetGymOpen,
  useUpdateBranch,
  useUpdateFacility,
  useUpdateGym,
  useUploadGymImage,
} from "@/modules/gym/hooks/use-gym";
import { branchSchema, facilitySchema, gymSchema } from "@/modules/gym/schemas";
import type { Gym, GymBranch, GymFacility } from "@/services/gym.service";
import { ConfirmDialog } from "@/shared/components/common/confirm-dialog";
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

const facilityTypes = [
  "EQUIPMENT",
  "AMENITY",
  "CLASS_ROOM",
  "LOCKER_ROOM",
  "SHOWER",
  "PARKING",
  "WIFI",
  "OTHER",
] as const;

const facilityTypeLabels: Record<string, string> = {
  EQUIPMENT: "Thiết bị",
  AMENITY: "Tiện nghi",
  CLASS_ROOM: "Phòng học",
  LOCKER_ROOM: "Phòng thay đồ",
  SHOWER: "Phòng tắm",
  PARKING: "Bãi đỗ xe",
  WIFI: "WiFi",
  OTHER: "Khác",
};

const gymStatusVariant: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  CLOSED: "destructive",
};

const partnerStatusVariant: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

function errorToast(
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

export function MyGymsPage() {
  const query = useMyGyms();
  const create = useCreateGym();
  const update = useUpdateGym();
  const status = useSetGymOpen();
  const upload = useUploadGymImage();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Gym | null>(null);
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof gymSchema>>({
    resolver: zodResolver(gymSchema),
    defaultValues: {
      name: "",
      description: "",
      city: "",
      district: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  function show(gym?: Gym) {
    setEditing(gym ?? null);
    form.reset(
      gym
        ? {
            name: gym.name ?? "",
            description: gym.description ?? "",
            city: gym.city ?? "",
            district: gym.district ?? "",
            address: gym.address ?? "",
            phone: gym.phone ?? "",
            email: gym.email ?? "",
          }
        : {
            name: "",
            description: "",
            city: "",
            district: "",
            address: "",
            phone: "",
            email: "",
          },
    );
    setOpen(true);
  }

  const ownedGyms = query.data?.content ?? [];
  const summary = [
    {
      label: "Tổng số phòng gym",
      value: ownedGyms.length,
      icon: Building2,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Phòng gym đang hoạt động",
      value: ownedGyms.filter((gym) => gym.status === "ACTIVE").length,
      icon: Activity,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Thành phố đang có mặt",
      value: new Set(ownedGyms.map((gym) => gym.city).filter(Boolean)).size,
      icon: MapPinned,
      tone: "bg-accent/10 text-accent",
    },
  ];

  return (
    <>
      <PageHeader
        title="Phòng gym của tôi"
        description="Quản lý tất cả phòng gym bạn sở hữu."
        action={
          <Button onClick={() => show()}>
            <Plus className="size-4" />
            Tạo phòng gym
          </Button>
        }
      />
      {!!ownedGyms.length && (
        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          {summary.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card/85 p-4 shadow-sm"
            >
              <span
                className={`grid size-11 place-items-center rounded-xl ${tone}`}
              >
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs font-bold text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </section>
      )}
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="grid gap-5">
          {query.data.content.map((gym) => (
            <article
              key={gym.id}
              className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md 2xl:grid-cols-[minmax(260px,1fr)_auto_280px]"
            >
              <div className="flex min-w-0 gap-4 p-6">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Building2 className="size-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black">{gym.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 shrink-0" />
                    {gym.district}, {gym.city}
                  </p>
                  <p className="mt-3 text-sm">{gym.address}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-4 2xl:border-y-0 2xl:border-l 2xl:px-5">
                <Link
                  className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-foreground px-4 text-sm font-bold text-background transition-all hover:-translate-y-0.5 hover:shadow-md"
                  href={`/gym/gyms/${gym.id}`}
                >
                  Quản lý
                </Link>
                <Button onClick={() => show(gym)}>Sửa</Button>
                {gym.id && (
                  <Button
                    variant="accent"
                    onClick={() =>
                      status.mutate({
                        id: gym.id!,
                        open: gym.status !== "ACTIVE",
                      })
                    }
                  >
                    {gym.status === "ACTIVE" ? "Đóng cửa gym" : "Mở lại gym"}
                  </Button>
                )}
              </div>
              {gym.id && (
                <div className="grid content-center gap-3 border-t border-border bg-muted/30 p-5 text-xs sm:grid-cols-[auto_1fr_1fr] sm:items-center 2xl:grid-cols-1 2xl:items-stretch 2xl:border-l 2xl:border-t-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                      Trạng thái
                    </span>
                    <Badge
                      variant={gymStatusVariant[String(gym.status)] ?? "default"}
                    >
                      {({ active: "Đang hoạt động", inactive: "Ngừng hoạt động", pending: "Đang chờ", approved: "Đã chấp nhận", rejected: "Đã từ chối", ended: "Đã kết thúc", confirmed: "Đã xác nhận", completed: "Hoàn thành", cancelled: "Đã hủy" })[String(gym.status).toLowerCase()] ?? gym.status}
                    </Badge>
                  </div>
                  <label
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 font-bold transition hover:border-primary hover:bg-primary/5"
                    htmlFor={`gym-logo-${gym.id}`}
                  >
                    <span>Tải lên logo</span>
                    <UploadCloud className="size-4 text-primary" />
                    <input
                      className="sr-only"
                      id={`gym-logo-${gym.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          upload.mutate({ id: gym.id!, file, kind: "logo" });
                      }}
                    />
                  </label>
                  <label
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 font-bold transition hover:border-primary hover:bg-primary/5"
                    htmlFor={`gym-cover-${gym.id}`}
                  >
                    <span>Tải lên ảnh bìa</span>
                    <UploadCloud className="size-4 text-primary" />
                    <input
                      className="sr-only"
                      id={`gym-cover-${gym.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          upload.mutate({ id: gym.id!, file, kind: "cover" });
                      }}
                    />
                  </label>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có phòng gym nào"
          description="Tạo phòng gym đầu tiên của bạn để bắt đầu quản lý."
        />
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Chỉnh sửa phòng gym" : "Tạo phòng gym"}
      >
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            const payload = {
              ...values,
              phone: values.phone || undefined,
              email: values.email || undefined,
            };
            try {
              if (editing?.id)
                await update.mutateAsync({ id: editing.id, payload });
              else await create.mutateAsync(payload);
              toast({
                type: "success",
                title: editing ? "Đã cập nhật phòng gym" : "Đã tạo phòng gym",
              });
              setOpen(false);
            } catch (error) {
              errorToast(toast, error, "Yêu cầu thất bại");
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
              label="Thành phố"
              error={form.formState.errors.city}
            >
              <Input {...form.register("city")} />
            </FieldShell>
            <FieldShell
              label="Quận/huyện"
              error={form.formState.errors.district}
            >
              <Input {...form.register("district")} />
            </FieldShell>
          </div>
          <FieldShell
            label="Địa chỉ"
            error={form.formState.errors.address}
          >
            <Input {...form.register("address")} />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell
              label="Số điện thoại"
              error={form.formState.errors.phone}
            >
              <Input {...form.register("phone")} />
            </FieldShell>
            <FieldShell
              label="Email"
              error={form.formState.errors.email}
            >
              <Input type="email" {...form.register("email")} />
            </FieldShell>
          </div>
          <Button className="w-full">Lưu thay đổi</Button>
        </form>
      </Dialog>
    </>
  );
}

export function GymManagePage({ gymId }: { gymId: number }) {
  const gym = useGymDetail(gymId);
  const branches = useGymBranches(gymId);
  const facilities = useGymFacilities(gymId);
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility();
  const deleteFacility = useDeleteFacility();
  const { toast } = useToast();
  const [branchOpen, setBranchOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<GymBranch | null>(null);
  const [facilityOpen, setFacilityOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<GymFacility | null>(null);
  const branchForm = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "", address: "", city: "", district: "", phone: "" },
  });
  const facilityForm = useForm<z.infer<typeof facilitySchema>>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      name: "",
      description: "",
      type: "EQUIPMENT",
      iconUrl: "",
      isAvailable: true,
    },
  });

  function showBranch(item?: GymBranch) {
    setEditingBranch(item ?? null);
    branchForm.reset(
      item
        ? {
            name: item.name ?? "",
            address: item.address ?? "",
            city: item.city ?? "",
            district: item.district ?? "",
            phone: item.phone ?? "",
          }
        : { name: "", address: "", city: "", district: "", phone: "" },
    );
    setBranchOpen(true);
  }

  function showFacility(item?: GymFacility) {
    setEditingFacility(item ?? null);
    facilityForm.reset(
      item
        ? {
            name: item.name ?? "",
            description: item.description ?? "",
            type: item.type ?? "EQUIPMENT",
            iconUrl: item.iconUrl ?? "",
            isAvailable: item.isAvailable ?? true,
          }
        : {
            name: "",
            description: "",
            type: "EQUIPMENT",
            iconUrl: "",
            isAvailable: true,
          },
    );
    setFacilityOpen(true);
  }

  if (gym.isLoading) return <LoadingSkeleton />;
  if (gym.isError || !gym.data)
    return (
      <EmptyState
        title="Không tìm thấy phòng gym"
        description={toErrorMessage(gym.error)}
      />
    );

  return (
    <>
      <PageHeader
        title={gym.data.name ?? "Gym"}
        description="Quản lý chi tiết phòng gym của bạn."
      />
      <section className="mb-8 grid gap-3 rounded-2xl border border-border bg-zinc-950 p-5 text-white shadow-lg sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-start gap-3 rounded-xl bg-card/5 p-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
              Địa chỉ
            </p>
            <p className="mt-1 text-sm font-bold">
              {gym.data.address}, {gym.data.district}, {gym.data.city}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-card/5 p-3">
          <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
              Số điện thoại
            </p>
            <p className="mt-1 text-sm font-bold">
              {gym.data.phone || "Chưa có số điện thoại"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-card/5 p-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
              Email
            </p>
            <p className="mt-1 truncate text-sm font-bold">
              {gym.data.email || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-card/5 p-3 sm:justify-start">
          <Activity className="size-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
              Trạng thái
            </p>
            <Badge className="mt-1 border-primary/30 bg-primary/10 text-primary">
              {({ active: "Đang hoạt động", inactive: "Ngừng hoạt động", pending: "Đang chờ", approved: "Đã chấp nhận", rejected: "Đã từ chối", ended: "Đã kết thúc", confirmed: "Đã xác nhận", completed: "Hoàn thành", cancelled: "Đã hủy" })[String(gym.data.status).toLowerCase()] ?? gym.data.status}
            </Badge>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <PageHeader
          title="Chi nhánh"
          description="Quản lý các chi nhánh của phòng gym."
          action={
            <Button onClick={() => showBranch()}>
              <Plus className="size-4" />
              Thêm chi nhánh
            </Button>
          }
        />
        {branches.data?.content?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {branches.data.content.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-black">{item.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.address}, {item.district}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => showBranch(item)}>
                    Sửa
                  </Button>
                  {item.id && (
                    <ConfirmDialog
                      label="Xóa"
                      title="Xóa chi nhánh"
                      onConfirm={() =>
                        deleteBranch.mutate({ gymId, id: item.id! })
                      }
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có chi nhánh"
            description="Thêm chi nhánh đầu tiên cho phòng gym của bạn."
          />
        )}
      </section>

      <section>
        <PageHeader
          title="Cơ sở vật chất"
          description="Quản lý các tiện nghi và thiết bị của phòng gym."
          action={
            <Button onClick={() => showFacility()}>
              <Plus className="size-4" />
              Thêm cơ sở vật chất
            </Button>
          }
        />
        {facilities.data?.content?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {facilities.data.content.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex justify-between">
                  <h3 className="font-black">{item.name}</h3>
                  <Badge variant="secondary">
                    {facilityTypeLabels[item.type] ?? item.type}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => showFacility(item)}>
                    Sửa
                  </Button>
                  {item.id && (
                    <ConfirmDialog
                      label="Xóa"
                      title="Xóa cơ sở vật chất"
                      onConfirm={() =>
                        deleteFacility.mutate({ gymId, id: item.id! })
                      }
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có cơ sở vật chất"
            description="Thêm cơ sở vật chất đầu tiên cho phòng gym của bạn."
          />
        )}
      </section>

      <Dialog
        open={branchOpen}
        onClose={() => setBranchOpen(false)}
        title={editingBranch ? "Chỉnh sửa chi nhánh" : "Thêm chi nhánh"}
      >
        <form
          className="space-y-3"
          onSubmit={branchForm.handleSubmit(async (values) => {
            try {
              const payload = { ...values, phone: values.phone || undefined };
              if (editingBranch?.id)
                await updateBranch.mutateAsync({
                  gymId,
                  id: editingBranch.id,
                  payload,
                });
              else await createBranch.mutateAsync({ gymId, payload });
              toast({
                type: "success",
                title: editingBranch ? "Đã cập nhật chi nhánh" : "Đã tạo chi nhánh",
              });
              setBranchOpen(false);
            } catch (error) {
              errorToast(toast, error, "Yêu cầu thất bại");
            }
          })}
        >
          <Input
            aria-label="Tên chi nhánh"
            placeholder="Tên chi nhánh"
            {...branchForm.register("name")}
          />
          <Input
            aria-label="Địa chỉ chi nhánh"
            placeholder="Địa chỉ chi nhánh"
            {...branchForm.register("address")}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              aria-label="Thành phố"
              placeholder="Thành phố"
              {...branchForm.register("city")}
            />
            <Input
              aria-label="Quận/huyện"
              placeholder="Quận/huyện"
              {...branchForm.register("district")}
            />
          </div>
          <Input
            aria-label="Số điện thoại chi nhánh"
            placeholder="Số điện thoại chi nhánh"
            {...branchForm.register("phone")}
          />
          <Button className="w-full">Lưu chi nhánh</Button>
        </form>
      </Dialog>

      <Dialog
        open={facilityOpen}
        onClose={() => setFacilityOpen(false)}
        title={editingFacility ? "Chỉnh sửa cơ sở vật chất" : "Thêm cơ sở vật chất"}
      >
        <form
          className="space-y-3"
          onSubmit={facilityForm.handleSubmit(async (values) => {
            try {
              const payload = {
                ...values,
                description: values.description || undefined,
                iconUrl: values.iconUrl || undefined,
              };
              if (editingFacility?.id)
                await updateFacility.mutateAsync({
                  gymId,
                  id: editingFacility.id,
                  payload,
                });
              else await createFacility.mutateAsync({ gymId, payload });
              toast({
                type: "success",
                title: editingFacility ? "Đã cập nhật cơ sở vật chất" : "Đã tạo cơ sở vật chất",
              });
              setFacilityOpen(false);
            } catch (error) {
              errorToast(toast, error, "Yêu cầu thất bại");
            }
          })}
        >
          <Input
            aria-label="Tên cơ sở vật chất"
            placeholder="Tên cơ sở vật chất"
            {...facilityForm.register("name")}
          />
          <Textarea
            aria-label="Mô tả cơ sở vật chất"
            className="min-h-24"
            placeholder="Mô tả cơ sở vật chất"
            {...facilityForm.register("description")}
          />
          <Controller
            control={facilityForm.control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại cơ sở vật chất" />
                </SelectTrigger>
                <SelectContent>
                  {facilityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {facilityTypeLabels[type] ?? type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input
            aria-label="URL icon cơ sở vật chất"
            placeholder="URL icon cơ sở vật chất"
            {...facilityForm.register("iconUrl")}
          />
          <label className="flex gap-2 text-sm font-bold">
            <input type="checkbox" {...facilityForm.register("isAvailable")} />
            Khả dụng
          </label>
          <Button className="w-full">Lưu cơ sở vật chất</Button>
        </form>
      </Dialog>
    </>
  );
}

export function GymPartnershipsPage() {
  const query = useGymPartnerships();
  const action = usePartnershipAction();
  const { toast } = useToast();

  async function run(id: number, kind: "approve" | "reject" | "end") {
    try {
      await action.mutateAsync({ id, action: kind });
      const title =
        kind === "approve"
          ? "Đã chấp nhận hợp tác"
          : kind === "reject"
            ? "Đã từ chối hợp tác"
            : "Đã kết thúc hợp tác";
      toast({ type: "success", title });
    } catch (error) {
      errorToast(toast, error, "Yêu cầu thất bại");
    }
  }

  return (
    <>
      <PageHeader
        title="Hợp tác"
        description="Quản lý các yêu cầu hợp tác với huấn luyện viên."
      />
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="space-y-4">
          {query.data.content.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-black">
                    {item.ptName ||
                      `Huấn luyện viên #${item.profileId}`}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.gymName} ·{" "}
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
                {item.id && (
                  <div className="flex gap-2">
                    {item.status === "PENDING" && (
                      <>
                        <Button onClick={() => void run(item.id!, "approve")}>
                          Chấp nhận
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => void run(item.id!, "reject")}
                        >
                          Từ chối
                        </Button>
                      </>
                    )}
                    {item.status === "APPROVED" && (
                      <Button
                        variant="destructive"
                        onClick={() => void run(item.id!, "end")}
                      >
                        Kết thúc hợp tác
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có yêu cầu hợp tác"
          description="Các yêu cầu hợp tác từ huấn luyện viên sẽ hiển thị tại đây."
        />
      )}
    </>
  );
}
