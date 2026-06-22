"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell, inputClassName } from "@/modules/forms/form-controls";
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
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
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
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
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

export function TrainerProfilePage() {
  const { t } = useTranslation();
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
        title={t("trainerModule.loadProfileError")}
        description={toErrorMessage(query.error)}
      />
    );
  return (
    <>
      <Header
        title={t("trainerModule.profileTitle")}
        description={t("trainerModule.profileDescription")}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <form
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await update.mutateAsync(values);
              toast({
                type: "success",
                title: t("trainerModule.profileUpdated"),
              });
            } catch (error) {
              fail(toast, error, t("common.requestFailed"));
            }
          })}
        >
          <FieldShell
            label={t("trainerModule.biography")}
            error={form.formState.errors.bio}
          >
            <textarea
              className={`${inputClassName} h-32 py-3`}
              {...form.register("bio")}
            />
          </FieldShell>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldShell
              label={t("trainerModule.experienceYears")}
              error={form.formState.errors.experienceYears}
            >
              <input
                className={inputClassName}
                type="number"
                {...form.register("experienceYears", { valueAsNumber: true })}
              />
            </FieldShell>
            <FieldShell
              label={t("trainerModule.priceHour")}
              error={form.formState.errors.pricePerHour}
            >
              <input
                className={inputClassName}
                type="number"
                {...form.register("pricePerHour", { valueAsNumber: true })}
              />
            </FieldShell>
            <FieldShell
              label={t("trainerModule.priceSession")}
              error={form.formState.errors.pricePerSession}
            >
              <input
                className={inputClassName}
                type="number"
                {...form.register("pricePerSession", { valueAsNumber: true })}
              />
            </FieldShell>
          </div>
          <Button disabled={update.isPending}>Save profile</Button>
        </form>
        <aside className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid size-24 place-items-center rounded-full bg-lime-300 text-2xl font-black text-zinc-950">
            {query.data?.username?.slice(0, 2).toUpperCase()}
          </div>
          <p className="mt-4 font-black">{query.data?.username}</p>
          <p className="text-sm text-zinc-500">{query.data?.email}</p>
          <label className="mt-5 block text-sm font-bold">
            Upload avatar
            <input
              className="mt-2 block w-full text-xs"
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  await upload.mutateAsync(file);
                  toast({
                    type: "success",
                    title: t("trainerModule.avatarUploaded"),
                  });
                } catch (error) {
                  fail(toast, error, t("common.requestFailed"));
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
  const { t } = useTranslation();
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
      <Header
        title={t("trainerModule.services")}
        description={t("trainerModule.servicesDescription")}
        action={
          <Button onClick={() => show()}>
            <Plus className="size-4" />
            Add service
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
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black">{item.name}</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.description || "No description"}
                  </p>
                </div>
                <Badge>{item.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="mt-4 font-black text-orange-600">
                {currency.format(item.price ?? 0)} · {item.durationMinutes} min
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => show(item)}>Edit</Button>
                <Button
                  className="bg-zinc-600"
                  onClick={() =>
                    item.id &&
                    toggle.mutate({ id: item.id, isActive: !item.isActive })
                  }
                >
                  <RefreshCw className="size-4" />
                  Toggle
                </Button>
                {item.id && (
                  <ConfirmDialog
                    label="Delete"
                    title="Delete this service?"
                    onConfirm={() => remove.mutate(item.id!)}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No services"
          description="Create the first service customers can book."
        />
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit service" : "Create service"}
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
                title: t(
                  editing
                    ? "trainerModule.serviceUpdated"
                    : "trainerModule.serviceCreated",
                ),
              });
              setOpen(false);
            } catch (error) {
              fail(toast, error, t("common.requestFailed"));
            }
          })}
        >
          <FieldShell label="Name" error={form.formState.errors.name}>
            <input className={inputClassName} {...form.register("name")} />
          </FieldShell>
          <FieldShell
            label="Description"
            error={form.formState.errors.description}
          >
            <textarea
              className={`${inputClassName} h-24 py-3`}
              {...form.register("description")}
            />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell label="Price" error={form.formState.errors.price}>
              <input
                className={inputClassName}
                type="number"
                {...form.register("price", { valueAsNumber: true })}
              />
            </FieldShell>
            <FieldShell
              label="Duration (minutes)"
              error={form.formState.errors.durationMinutes}
            >
              <input
                className={inputClassName}
                type="number"
                {...form.register("durationMinutes", { valueAsNumber: true })}
              />
            </FieldShell>
          </div>
          <Button className="w-full">{editing ? "Update" : "Create"}</Button>
        </form>
      </Dialog>
    </>
  );
}

export function TrainerAvailabilityPage() {
  const { t } = useTranslation();
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
      <Header
        title={t("trainerModule.availability")}
        description={t("trainerModule.availabilityDescription")}
      />
      <form
        className="mb-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-5"
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
              title: t(
                editing
                  ? "trainerModule.availabilityUpdated"
                  : "trainerModule.availabilityCreated",
              ),
            });
            edit();
          } catch (error) {
            fail(toast, error, t("common.requestFailed"));
          }
        })}
      >
        <select
          className={inputClassName}
          {...form.register("dayOfWeek", { valueAsNumber: true })}
        >
          {days.map((day, index) => (
            <option key={day} value={index}>
              {day}
            </option>
          ))}
        </select>
        <input
          aria-label="Start time"
          className={inputClassName}
          type="time"
          {...form.register("startTime")}
        />
        <input
          aria-label="End time"
          className={inputClassName}
          type="time"
          {...form.register("endTime")}
        />
        <input
          aria-label="Effective date"
          className={inputClassName}
          type="date"
          {...form.register("effectiveDate")}
        />
        <Button>{editing ? "Update" : "Add slot"}</Button>
      </form>
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.content.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h2 className="font-black">{days[item.dayOfWeek ?? 0]}</h2>
              <p className="mt-2">
                {timeText(item.startTime)}–{timeText(item.endTime)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {item.isRecurring ? "Recurring" : item.effectiveDate}
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => edit(item)}>Edit</Button>
                {item.id && (
                  <ConfirmDialog
                    label="Delete"
                    title="Delete this availability?"
                    onConfirm={() => remove.mutate(item.id!)}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No availability"
          description="Add a working slot above."
        />
      )}
    </>
  );
}

export function TrainerCertificatesPage() {
  const { t } = useTranslation();
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
      <Header
        title={t("trainerModule.certificates")}
        description={t("trainerModule.certificatesDescription")}
        action={
          <Button onClick={() => show()}>
            <Plus className="size-4" />
            Add certificate
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
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h2 className="font-black">{item.name}</h2>
              <p className="text-sm text-zinc-500">{item.issuingOrg}</p>
              <p className="mt-3 text-xs font-bold">
                {item.issueDate || "No issue date"} →{" "}
                {item.expiryDate || "No expiry"}
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => show(item)}>Edit</Button>
                {item.id && (
                  <ConfirmDialog
                    label="Delete"
                    title="Delete this certificate?"
                    onConfirm={() => remove.mutate(item.id!)}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No certificates"
          description="Add professional credentials."
        />
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit certificate" : "Add certificate"}
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
                title: t(
                  editing
                    ? "trainerModule.certificateUpdated"
                    : "trainerModule.certificateCreated",
                ),
              });
              setOpen(false);
            } catch (error) {
              fail(toast, error, t("common.requestFailed"));
            }
          })}
        >
          <FieldShell label="Name" error={form.formState.errors.name}>
            <input className={inputClassName} {...form.register("name")} />
          </FieldShell>
          <FieldShell
            label="Issuing organization"
            error={form.formState.errors.issuingOrg}
          >
            <input
              className={inputClassName}
              {...form.register("issuingOrg")}
            />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <input
              aria-label="Issue date"
              className={inputClassName}
              type="date"
              {...form.register("issueDate")}
            />
            <input
              aria-label="Expiry date"
              className={inputClassName}
              type="date"
              {...form.register("expiryDate")}
            />
          </div>
          <input
            multiple
            type="file"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          <Button className="w-full">Save certificate</Button>
        </form>
      </Dialog>
    </>
  );
}

export function TrainerPartnershipsPage() {
  const { t } = useTranslation();
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
      <Header
        title={t("trainerModule.partnerships")}
        description={t("trainerModule.partnershipsDescription")}
      />
      <form
        className="mb-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-[180px_1fr_auto]"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await request.mutateAsync(values);
            form.reset();
            toast({
              type: "success",
              title: t("trainerModule.partnershipRequested"),
            });
          } catch (error) {
            fail(toast, error, t("common.requestFailed"));
          }
        })}
      >
        <input
          aria-label="Gym ID"
          className={inputClassName}
          min="1"
          placeholder="Gym ID"
          type="number"
          {...form.register("gymId", { valueAsNumber: true })}
        />
        <input
          aria-label="Request message"
          className={inputClassName}
          placeholder="Request message"
          {...form.register("requestMessage")}
        />
        <Button>Send request</Button>
      </form>
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="space-y-3">
          {query.data.content.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-black">
                  {item.gymName || `Gym #${item.gymId}`}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {item.requestMessage || "No message"}
                </p>
                <Badge className="mt-3">{item.status}</Badge>
              </div>
              {item.id && item.status === "APPROVED" && (
                <ConfirmDialog
                  label="End partnership"
                  title="End this partnership?"
                  onConfirm={() => end.mutate(item.id!)}
                />
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No partnerships"
          description="Send a request using a gym ID."
        />
      )}
    </>
  );
}
