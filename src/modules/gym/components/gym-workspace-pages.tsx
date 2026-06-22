"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Plus } from "lucide-react";
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
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      </div>
      {action}
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
            Create gym
          </Button>
        }
      />
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.data?.content?.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {query.data.content.map((gym) => (
            <article
              key={gym.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{gym.name}</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {gym.district}, {gym.city}
                  </p>
                </div>
                <Badge>{gym.status}</Badge>
              </div>
              <p className="mt-3 text-sm">{gym.address}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-11 items-center rounded-md bg-zinc-950 px-4 text-sm font-bold text-white dark:bg-lime-300 dark:text-zinc-950"
                  href={`/gym/gyms/${gym.id}`}
                >
                  Manage
                </Link>
                <Button onClick={() => show(gym)}>Edit</Button>
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
                    {gym.status === "ACTIVE" ? "Close" : "Reopen"}
                  </Button>
                )}
              </div>
              {gym.id && (
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <label className="font-bold">
                    Upload logo
                    <input
                      className="mt-1 block w-full"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          upload.mutate({ id: gym.id!, file, kind: "logo" });
                      }}
                    />
                  </label>
                  <label className="font-bold">
                    Upload cover
                    <input
                      className="mt-1 block w-full"
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
          title="No gyms"
          description="Create your first gym to add branches and facilities."
        />
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit gym" : "Create gym"}
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
          <Button className="w-full">Save gym</Button>
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
              Add branch
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
                  <Button onClick={() => showBranch(item)}>Edit</Button>
                  {item.id && (
                    <ConfirmDialog
                      label="Delete"
                      title="Delete this branch?"
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
            title="No branches"
            description="Add the first physical location."
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
              Add facility
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
                  <Badge>{item.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{item.description}</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => showFacility(item)}>Edit</Button>
                  {item.id && (
                    <ConfirmDialog
                      label="Delete"
                      title="Delete this facility?"
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
            title="No facilities"
            description="Add equipment or amenities."
          />
        )}
      </section>
      <Dialog
        open={branchOpen}
        onClose={() => setBranchOpen(false)}
        title={editingBranch ? "Edit branch" : "Add branch"}
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
            aria-label="Branch name"
            className={inputClassName}
            placeholder="Name"
            {...branchForm.register("name")}
          />
          <input
            aria-label="Branch address"
            className={inputClassName}
            placeholder="Address"
            {...branchForm.register("address")}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="Branch city"
              className={inputClassName}
              placeholder="City"
              {...branchForm.register("city")}
            />
            <input
              aria-label="Branch district"
              className={inputClassName}
              placeholder="District"
              {...branchForm.register("district")}
            />
          </div>
          <input
            aria-label="Branch phone"
            className={inputClassName}
            placeholder="Phone"
            {...branchForm.register("phone")}
          />
          <Button className="w-full">Save branch</Button>
        </form>
      </Dialog>
      <Dialog
        open={facilityOpen}
        onClose={() => setFacilityOpen(false)}
        title={editingFacility ? "Edit facility" : "Add facility"}
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
            aria-label="Facility name"
            className={inputClassName}
            placeholder="Name"
            {...facilityForm.register("name")}
          />
          <textarea
            aria-label="Facility description"
            className={`${inputClassName} h-24 py-3`}
            placeholder="Description"
            {...facilityForm.register("description")}
          />
          <select
            aria-label="Facility type"
            className={inputClassName}
            {...facilityForm.register("type")}
          >
            {facilityTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input
            aria-label="Facility icon URL"
            className={inputClassName}
            placeholder="Icon URL"
            {...facilityForm.register("iconUrl")}
          />
          <label className="flex gap-2 text-sm font-bold">
            <input type="checkbox" {...facilityForm.register("isAvailable")} />
            Available
          </label>
          <Button className="w-full">Save facility</Button>
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
                    {item.ptName || `Trainer #${item.profileId}`}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.gymName} · {item.requestMessage || "No message"}
                  </p>
                  <Badge className="mt-3">{item.status}</Badge>
                </div>
                {item.id && (
                  <div className="flex gap-2">
                    {item.status === "PENDING" && (
                      <>
                        <Button onClick={() => void run(item.id!, "approve")}>
                          Approve
                        </Button>
                        <Button
                          className="bg-red-600"
                          onClick={() => void run(item.id!, "reject")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {item.status === "APPROVED" && (
                      <Button
                        className="bg-red-600"
                        onClick={() => void run(item.id!, "end")}
                      >
                        End
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
          title="No partnerships"
          description="PT requests will appear here."
        />
      )}
    </>
  );
}
