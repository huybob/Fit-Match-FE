"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Building2, Eye, ScrollText } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { GymPolicy, UpdateGymProfileInput } from "@/types/Gym";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { WorkspaceHeader } from "@/shared/components/common/workspace-header";
import { useTranslations } from "next-intl";

/** UC-017 (B-11): chính sách đặt lịch/hủy/no-show/nội quy — BE có sẵn, trước đây FE = 0. */
function PoliciesSection() {
  const t = useTranslations();
  const { toast } = useToast();
  const [policy, setPolicy] = useState<GymPolicy>({});

  const query = useQuery({ queryKey: ["gym-policies"], queryFn: gymService.getPolicies });

  useEffect(() => {
    if (query.data) setPolicy(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      gymService.updatePolicies({
        bookingPolicy: policy.bookingPolicy?.trim() || undefined,
        cancellationPolicy: policy.cancellationPolicy?.trim() || undefined,
        noShowPolicy: policy.noShowPolicy?.trim() || undefined,
        houseRules: policy.houseRules?.trim() || undefined,
      }),
    onSuccess: () => toast({ type: "success", title: t("gym.settings.policySaved") }),
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) }),
  });

  const fields: Array<{ key: keyof GymPolicy; label: string; placeholder: string }> = [
    { key: "bookingPolicy", label: t("gym.settings.bookingPolicy"), placeholder: t("gym.settings.bookingPolicyHint") },
    { key: "cancellationPolicy", label: t("gym.settings.cancelPolicy"), placeholder: t("gym.settings.cancelPolicyHint") },
    { key: "noShowPolicy", label: t("gym.settings.noShowPolicy"), placeholder: t("gym.settings.noShowPolicyHint") },
    { key: "houseRules", label: t("gym.settings.houseRules"), placeholder: t("gym.settings.houseRulesHint") },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
        <ScrollText className="size-4 text-primary" /> {t("gym.settings.policiesTitle")}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        {t("gym.settings.policiesHint")}
      </p>
      {query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
              <Textarea
                value={(policy[key] as string) ?? ""}
                onChange={(e) => setPolicy((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={2}
                maxLength={2000}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {save.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.settings.savePolicies")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymSettingsPage() {
  const t = useTranslations();
  const { toast } = useToast();

  const [gymName, setGymName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [visible, setVisible] = useState(true);

  const { data: status, isLoading } = useQuery({
    queryKey: ["gym-verification-status"],
    queryFn: gymService.getVerificationStatus
  });

  useEffect(() => {
    if (!status) return;
    setGymName(status.gymName ?? "");
    setDescription(status.description ?? "");
    setAddress(status.address ?? "");
    setCity(status.city ?? "");
    setPhone(status.phone ?? "");
    // B-9/A-12: init toggle từ trạng thái thật trên server — trước đây hardcode true
    // khiến operator bật/tắt "mù" (tưởng đang public khi đang ẩn).
    setVisible(status.active ?? false);
  }, [status]);

  const saveProfile = useMutation({
    mutationFn: (payload: UpdateGymProfileInput) => gymService.updateProfile(payload),
    onSuccess: () => toast({ type: "success", title: t("gym.settings.profileUpdated") }),
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) })
  });

  const saveVisibility = useMutation({
    mutationFn: (v: boolean) => gymService.setVisibility(v),
    onSuccess: (_d, v) => toast({ type: "success", title: v ? t("gym.settings.shownOnMarketplace") : t("gym.settings.hiddenFromMarketplace") }),
    onError: (e, v) => {
      // Đảo lại toggle khi BE từ chối (vd chưa APPROVED, chưa có branch active).
      setVisible(!v);
      toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) });
    },
  });

  const notApproved = !!status && status.verificationStatus !== "APPROVED";

  function submit() {
    if (!gymName.trim()) { toast({ type: "warning", title: t("gym.settings.nameRequired") }); return; }
    saveProfile.mutate({
      gymName: gymName.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      phone: phone.trim() || undefined
    });
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <WorkspaceHeader />

      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t("gym.settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("gym.settings.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-4"><Building2 className="size-4 text-primary" /> {t("gym.settings.profileTitle")}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("gym.settings.nameLabel")} <span className="text-destructive">*</span></label>
                  <Input value={gymName} onChange={e => setGymName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.description")}</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.address")}</label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} />
                    {/* Bug S2-01: admin yêu cầu xác minh lại địa chỉ — hiện ngay cạnh ô
                        cần sửa, kèm lý do. Cờ tự gỡ sau khi lưu địa chỉ mới. */}
                    {status?.addressVerified === false && (
                      <p className="mt-1.5 rounded-lg border border-warning/30 bg-warning-muted px-2.5 py-2 text-[11px] font-semibold text-warning">
                        {t("gym.settings.addressRecheckNotice")}
                        {status.addressReviewNote ? ` — ${status.addressReviewNote}` : ""}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.city")}</label>
                    <Input value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("common.table.phone")}</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={submit} disabled={saveProfile.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    {saveProfile.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.settings.saveProfile")}
                  </Button>
                </div>
              </div>
            </div>

            <PoliciesSection />

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-4"><Eye className="size-4 text-primary" /> {t("gym.settings.visibilityTitle")}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("gym.settings.visibilityHint")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {notApproved
                      ? t("gym.settings.visibilityLocked")
                      : t("gym.settings.visibilityOn")}
                  </p>
                </div>
                <Switch
                  checked={visible}
                  disabled={saveVisibility.isPending || notApproved}
                  onCheckedChange={(v) => { setVisible(v); saveVisibility.mutate(v); }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
