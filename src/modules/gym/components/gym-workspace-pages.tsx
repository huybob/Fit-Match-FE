"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Building2, MapPin, Plus, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell, inputClassName } from "@/modules/forms/form-controls";
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
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
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
function Header({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative mb-7 flex flex-col gap-5 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/75 px-6 py-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div className="absolute -right-12 -top-16 size-36 rounded-full bg-lime-300/20 blur-3xl" />
      <div className="relative">
        <div className="mb-3 h-1 w-10 rounded-full bg-orange-500" />
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>
      <div className="relative shrink-0">{action}</div>
    </div>
  );
}
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
  const { t } = useTranslation();
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
  return (
    <>
      <Header
        title={t("gymModule.myGyms")}
        description={t("gymModule.myGymsDescription")}
        action={
          <Button onClick={() => show()}>
            <Plus className="size-4" />
            {t("gymModule.createGym")}
          </Button>
        }
      />
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="grid gap-5">
          {query.data.content.map((gym) => (
            <article
              key={gym.id}
              className="grid overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 lg:grid-cols-[minmax(0,1fr)_auto_320px]"
            >
              <div className="flex min-w-0 gap-4 p-6">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-lime-300/25 text-lime-700 dark:text-lime-300">
                  <Building2 className="size-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black">{gym.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                    <MapPin className="size-4 shrink-0" />
                    {gym.district}, {gym.city}
                  </p>
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                    {gym.address}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800 lg:border-y-0 lg:border-l lg:px-5">
                <Link
                  className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-lime-300 dark:text-zinc-950"
                  href={`/gym/gyms/${gym.id}`}
                >
                  {t("common.manage")}
                </Link>
                <Button onClick={() => show(gym)}>{t("common.edit")}</Button>
                {gym.id && (
                  <Button
                    className="bg-orange-600"
                    onClick={() =>
                      status.mutate({
                        id: gym.id!,
                        open: gym.status !== "ACTIVE",
                      })
                    }
                  >
                    {t(
                      gym.status === "ACTIVE"
                        ? "gymModule.closeGym"
                        : "gymModule.reopenGym",
                    )}
                  </Button>
                )}
              </div>
              {gym.id && (
                <div className="grid content-center gap-3 border-t border-zinc-100 bg-zinc-50/70 p-5 text-xs dark:border-zinc-800 dark:bg-zinc-900/50 lg:border-l lg:border-t-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
                      {t("common.status")}
                    </span>
                    <Badge>
                      {t(`statusLabels.${String(gym.status).toLowerCase()}`, {
                        defaultValue: gym.status,
                      })}
                    </Badge>
                  </div>
                  <label
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 font-bold transition hover:border-lime-400 hover:bg-lime-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-lime-950/20"
                    htmlFor={`gym-logo-${gym.id}`}
                  >
                    <span>{t("gymModule.uploadLogo")}</span>
                    <UploadCloud className="size-4 text-lime-600" />
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
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 font-bold transition hover:border-lime-400 hover:bg-lime-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-lime-950/20"
                    htmlFor={`gym-cover-${gym.id}`}
                  >
                    <span>{t("gymModule.uploadCover")}</span>
                    <UploadCloud className="size-4 text-lime-600" />
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
          title={t("gymModule.emptyOwnedGyms")}
          description={t("gymModule.emptyOwnedGymsDescription")}
        />
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t(editing ? "gymModule.editGym" : "gymModule.createGym")}
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
                title: t(
                  editing ? "gymModule.gymUpdated" : "gymModule.gymCreated",
                ),
              });
              setOpen(false);
            } catch (error) {
              errorToast(toast, error, t("common.requestFailed"));
            }
          })}
        >
          <FieldShell
            label={t("common.name")}
            error={form.formState.errors.name}
          >
            <input className={inputClassName} {...form.register("name")} />
          </FieldShell>
          <FieldShell
            label={t("common.description")}
            error={form.formState.errors.description}
          >
            <textarea
              className={`${inputClassName} h-24 py-3`}
              {...form.register("description")}
            />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell
              label={t("gymModule.city")}
              error={form.formState.errors.city}
            >
              <input className={inputClassName} {...form.register("city")} />
            </FieldShell>
            <FieldShell
              label={t("gymModule.district")}
              error={form.formState.errors.district}
            >
              <input
                className={inputClassName}
                {...form.register("district")}
              />
            </FieldShell>
          </div>
          <FieldShell
            label={t("common.address")}
            error={form.formState.errors.address}
          >
            <input className={inputClassName} {...form.register("address")} />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell
              label={t("common.phone")}
              error={form.formState.errors.phone}
            >
              <input className={inputClassName} {...form.register("phone")} />
            </FieldShell>
            <FieldShell
              label={t("common.email")}
              error={form.formState.errors.email}
            >
              <input
                className={inputClassName}
                type="email"
                {...form.register("email")}
              />
            </FieldShell>
          </div>
          <Button className="w-full">{t("common.save")}</Button>
        </form>
      </Dialog>
    </>
  );
}

export function GymManagePage({ gymId }: { gymId: number }) {
  const { t } = useTranslation();
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
  const [editingFacility, setEditingFacility] = useState<GymFacility | null>(
    null,
  );
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
        title={t("gymModule.notFound")}
        description={toErrorMessage(gym.error)}
      />
    );
  return (
    <>
      <Header
        title={gym.data.name ?? "Gym"}
        description={t("gymModule.manageDescription")}
      />
      <section className="mb-10">
        <Header
          title={t("gymModule.branches")}
          description={t("gymModule.branchesDescription")}
          action={
            <Button onClick={() => showBranch()}>
              <Plus className="size-4" />
              {t("gymModule.addBranch")}
            </Button>
          }
        />
        {branches.data?.content?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {branches.data.content.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="font-black">{item.name}</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  {item.address}, {item.district}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => showBranch(item)}>
                    {t("common.edit")}
                  </Button>
                  {item.id && (
                    <ConfirmDialog
                      label={t("common.delete")}
                      title={t("gymModule.deleteBranchTitle")}
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
            title={t("gymModule.noBranches")}
            description={t("gymModule.emptyBranchesDescription")}
          />
        )}
      </section>
      <section>
        <Header
          title={t("gymModule.facilities")}
          description={t("gymModule.facilitiesDescription")}
          action={
            <Button onClick={() => showFacility()}>
              <Plus className="size-4" />
              {t("gymModule.addFacility")}
            </Button>
          }
        />
        {facilities.data?.content?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {facilities.data.content.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex justify-between">
                  <h3 className="font-black">{item.name}</h3>
                  <Badge>
                    {t(`gymModule.facilityTypes.${item.type}`, {
                      defaultValue: item.type,
                    })}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{item.description}</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => showFacility(item)}>
                    {t("common.edit")}
                  </Button>
                  {item.id && (
                    <ConfirmDialog
                      label={t("common.delete")}
                      title={t("gymModule.deleteFacilityTitle")}
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
            title={t("gymModule.noFacilities")}
            description={t("gymModule.emptyFacilitiesDescription")}
          />
        )}
      </section>
      <Dialog
        open={branchOpen}
        onClose={() => setBranchOpen(false)}
        title={t(
          editingBranch ? "gymModule.editBranch" : "gymModule.addBranch",
        )}
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
                title: t(
                  editingBranch
                    ? "gymModule.branchUpdated"
                    : "gymModule.branchCreated",
                ),
              });
              setBranchOpen(false);
            } catch (error) {
              errorToast(toast, error, t("common.requestFailed"));
            }
          })}
        >
          <input
            aria-label={t("gymModule.branchName")}
            className={inputClassName}
            placeholder={t("gymModule.branchName")}
            {...branchForm.register("name")}
          />
          <input
            aria-label={t("gymModule.branchAddress")}
            className={inputClassName}
            placeholder={t("gymModule.branchAddress")}
            {...branchForm.register("address")}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label={t("gymModule.city")}
              className={inputClassName}
              placeholder={t("gymModule.city")}
              {...branchForm.register("city")}
            />
            <input
              aria-label={t("gymModule.district")}
              className={inputClassName}
              placeholder={t("gymModule.district")}
              {...branchForm.register("district")}
            />
          </div>
          <input
            aria-label={t("gymModule.branchPhone")}
            className={inputClassName}
            placeholder={t("gymModule.branchPhone")}
            {...branchForm.register("phone")}
          />
          <Button className="w-full">{t("gymModule.saveBranch")}</Button>
        </form>
      </Dialog>
      <Dialog
        open={facilityOpen}
        onClose={() => setFacilityOpen(false)}
        title={t(
          editingFacility ? "gymModule.editFacility" : "gymModule.addFacility",
        )}
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
                title: t(
                  editingFacility
                    ? "gymModule.facilityUpdated"
                    : "gymModule.facilityCreated",
                ),
              });
              setFacilityOpen(false);
            } catch (error) {
              errorToast(toast, error, t("common.requestFailed"));
            }
          })}
        >
          <input
            aria-label={t("gymModule.facilityName")}
            className={inputClassName}
            placeholder={t("gymModule.facilityName")}
            {...facilityForm.register("name")}
          />
          <textarea
            aria-label={t("gymModule.facilityDescription")}
            className={`${inputClassName} h-24 py-3`}
            placeholder={t("gymModule.facilityDescription")}
            {...facilityForm.register("description")}
          />
          <select
            aria-label={t("gymModule.facilityType")}
            className={inputClassName}
            {...facilityForm.register("type")}
          >
            {facilityTypes.map((type) => (
              <option key={type} value={type}>
                {t(`gymModule.facilityTypes.${type}`)}
              </option>
            ))}
          </select>
          <input
            aria-label={t("gymModule.facilityIconUrl")}
            className={inputClassName}
            placeholder={t("gymModule.facilityIconUrl")}
            {...facilityForm.register("iconUrl")}
          />
          <label className="flex gap-2 text-sm font-bold">
            <input type="checkbox" {...facilityForm.register("isAvailable")} />
            {t("common.available")}
          </label>
          <Button className="w-full">{t("gymModule.saveFacility")}</Button>
        </form>
      </Dialog>
    </>
  );
}

export function GymPartnershipsPage() {
  const { t } = useTranslation();
  const query = useGymPartnerships();
  const action = usePartnershipAction();
  const { toast } = useToast();
  async function run(id: number, kind: "approve" | "reject" | "end") {
    try {
      await action.mutateAsync({ id, action: kind });
      const key =
        kind === "approve"
          ? "gymModule.partnershipApproved"
          : kind === "reject"
            ? "gymModule.partnershipRejected"
            : "gymModule.partnershipEnded";
      toast({ type: "success", title: t(key) });
    } catch (error) {
      errorToast(toast, error, t("common.requestFailed"));
    }
  }
  return (
    <>
      <Header
        title={t("gymModule.partnerships")}
        description={t("gymModule.partnershipsDescription")}
      />
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="space-y-4">
          {query.data.content.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-black">
                    {item.ptName ||
                      `${t("common.trainers")} #${item.profileId}`}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.gymName} ·{" "}
                    {item.requestMessage || t("common.noMessage")}
                  </p>
                  <Badge className="mt-3">
                    {t(`statusLabels.${String(item.status).toLowerCase()}`, {
                      defaultValue: item.status,
                    })}
                  </Badge>
                </div>
                {item.id && (
                  <div className="flex gap-2">
                    {item.status === "PENDING" && (
                      <>
                        <Button onClick={() => void run(item.id!, "approve")}>
                          {t("gymModule.approve")}
                        </Button>
                        <Button
                          className="bg-red-600"
                          onClick={() => void run(item.id!, "reject")}
                        >
                          {t("gymModule.reject")}
                        </Button>
                      </>
                    )}
                    {item.status === "APPROVED" && (
                      <Button
                        className="bg-red-600"
                        onClick={() => void run(item.id!, "end")}
                      >
                        {t("gymModule.end")}
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
          title={t("gymModule.emptyPartnerships")}
          description={t("gymModule.emptyPartnershipsDescription")}
        />
      )}
    </>
  );
}
