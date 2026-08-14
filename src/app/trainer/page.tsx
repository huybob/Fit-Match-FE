"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Award, ShieldCheck, Clock, AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { trainerService } from "@/services/trainer.service";
import type { CertificationResponse, UpdatePtProfileRequest } from "@/types/Trainer";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog } from "@/shared/components/ui/dialog";
import { EmptyState } from "@/shared/components/common/empty-state";
import { ImageUploader } from "@/shared/components/media/image-uploader";
import { SmartImage } from "@/shared/components/media/smart-image";
import { useDeleteMedia, useEntityMedia, mediaKeys } from "@/modules/media/hooks/use-media";
import { useTranslations } from "next-intl";

/* Chỉ giữ class + icon; nhãn lấy từ trainer.verifyStatus.* trong component. */
type VerifyKey = "APPROVED" | "PENDING" | "REQUIRES_INFO" | "REJECTED" | "SUSPENDED" | "NOT_SUBMITTED";

const STATUS: Record<string, { key: VerifyKey; cls: string; icon: typeof CheckCircle2 }> = {
  APPROVED: { key: "APPROVED", cls: "bg-success-muted text-success", icon: CheckCircle2 },
  PENDING: { key: "PENDING", cls: "bg-warning-muted text-warning", icon: Clock },
  REQUIRES_INFO: { key: "REQUIRES_INFO", cls: "bg-warning-muted text-warning", icon: AlertCircle },
  REJECTED: { key: "REJECTED", cls: "bg-destructive/10 text-destructive", icon: AlertCircle },
  SUSPENDED: { key: "SUSPENDED", cls: "bg-destructive/10 text-destructive", icon: AlertCircle },
  NOT_SUBMITTED: { key: "NOT_SUBMITTED", cls: "bg-muted text-muted-foreground", icon: AlertCircle },
};

export default function TrainerSelfServicePage() {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const profileQuery = useQuery({
    queryKey: ["pt-my-profile"],
    queryFn: trainerService.getMyProfilePreview
  });
  const profile = profileQuery.data;
  const isLoading = profileQuery.isLoading;
  // A-6 (audit 2026-07-17): badge trước đây đọc verificationStatus từ preview —
  // response không có field đó nên luôn hiện "Chưa xác minh". Gọi đúng endpoint.
  const { data: verification } = useQuery({
    queryKey: ["pt-verification-status"],
    queryFn: trainerService.getVerificationStatus,
  });
  const { data: certs = [] } = useQuery({
    queryKey: ["pt-my-certs"],
    queryFn: trainerService.listCertifications
  });

  /*
   * Ảnh đại diện hồ sơ PT — media TRAINER/AVATAR (V64), KHÔNG phải ảnh tài khoản
   * ở /profile. Quyền đã có sẵn ở MediaAccessGuard: PT tự sửa ảnh mình, gym chủ
   * quản cũng sửa được. AVATAR là loại ảnh đơn nên upload tấm mới là BE tự thay
   * tấm cũ, không cần xoá trước.
   */
  const avatarQuery = useEntityMedia("TRAINER", profile?.id, "AVATAR");
  const removeAvatar = useDeleteMedia();
  function refreshAvatar() {
    qc.invalidateQueries({ queryKey: mediaKeys.all });
    // Ảnh ở header đọc từ profile.avatarUrl do BE trả — không làm mới cái này
    // thì upload xong ô chọn đổi ảnh còn header vẫn là chữ cái đầu.
    qc.invalidateQueries({ queryKey: ["pt-my-profile"] });
  }

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: (payload: UpdatePtProfileRequest) => trainerService.updateMyLimitedProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pt-my-profile"] });
      setOpen(false);
      toast({ type: "success", title: t("trainer.profile.updated") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.error"), description: toErrorMessage(e) })
  });

  function submit() {
    if (!displayName.trim()) { toast({ type: "warning", title: t("trainer.profile.nameRequired") }); return; }
    // A-2: BE reject toàn request nếu gửi specialization/serviceArea/experienceYears
    // (các field năng lực do Gym quản lý — UC-019/020) — chỉ gửi displayName + bio.
    save.mutate({
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
    });
  }

  const st = STATUS[verification?.verificationStatus ?? "NOT_SUBMITTED"] ?? STATUS.NOT_SUBMITTED;
  const StIcon = st.icon;

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("trainer.profile.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("trainer.profile.subtitle")}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : profileQuery.isError ? (
          /* Không có nhánh này thì hồ sơ tải lỗi vẫn render ra một hồ sơ RỖNG
             ("T", "—", "Chưa xác minh") — PT tưởng hồ sơ mình trống chứ không
             biết là request hỏng, và không có cách thử lại. */
          <EmptyState
            icon={AlertCircle}
            title={t("common.states.errorTitle")}
            description={toErrorMessage(profileQuery.error)}
            action={
              <Button type="button" variant="outline" onClick={() => profileQuery.refetch()}>
                {t("common.actions.retry")}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <SmartImage
                      src={profile?.avatarUrl}
                      alt={profile?.displayName ?? ""}
                      className="size-16 rounded-2xl object-cover shrink-0"
                      fallbackClassName="bg-gradient-to-br from-primary/80 to-primary text-2xl font-bold text-primary-foreground"
                      fallback={(profile?.displayName ?? "T")[0]?.toUpperCase()}
                    />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{profile?.displayName ?? "—"}</h2>
                      {profile?.specialization && <p className="text-sm text-muted-foreground mt-0.5">{profile.specialization}</p>}
                      <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.cls}`}>
                        <StIcon className="size-3" /> {t(`trainer.verifyStatus.${st.key}`)}
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => setOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Pencil className="size-4" /> {t("trainer.profile.edit")}
                  </Button>
                </div>
                {/* Chỉ dựng ô upload khi đã biết id hồ sơ: ImageUploader coi
                    entityId rỗng là chế độ NHÁP và sẽ đẩy ảnh lên storage mà
                    không gắn vào hồ sơ nào — ảnh mồ côi, PT không hiểu vì sao
                    upload xong mà không thấy gì. */}
                {profile?.id != null && (
                <div className="mt-5 border-t border-border pt-4">
                  <ImageUploader
                    entityType="TRAINER"
                    entityId={profile.id}
                    imageType="AVATAR"
                    value={avatarQuery.data ?? []}
                    // Danh sách refetch từ BE nên onChange chỉ cần kích hoạt invalidate.
                    onChange={refreshAvatar}
                    onRemove={(m) => removeAvatar.mutateAsync(m.id).then(refreshAvatar)}
                    multiple={false}
                    max={1}
                    label={t("trainer.profile.avatarLabel")}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("trainer.profile.avatarHint")}
                  </p>
                </div>
                )}
                {verification?.rejectionReason && (
                  <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">{verification.rejectionReason}</div>
                )}
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs font-semibold text-muted-foreground uppercase">{t("trainer.profile.experienceLabel")}</p><p className="mt-0.5 text-foreground">{profile?.experienceYears != null ? t("trainer.profile.years", { years: profile.experienceYears }) : "—"}</p></div>
                  <div><p className="text-xs font-semibold text-muted-foreground uppercase">{t("trainer.profile.areaLabel")}</p><p className="mt-0.5 flex items-center gap-1 text-foreground">{profile?.serviceArea ? <><MapPin className="size-3.5 text-muted-foreground" />{profile.serviceArea}</> : "—"}</p></div>
                </div>
                {profile?.bio && (
                  <div className="mt-4"><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t("trainer.profile.bio")}</p><p className="text-sm text-foreground leading-relaxed">{profile.bio}</p></div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3"><Award className="size-4 text-primary" /> {t("trainer.profile.certs")}</h2>
              {(certs as CertificationResponse[]).length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">{t("trainer.profile.noCerts")}</p>
              ) : (
                <div className="space-y-2">
                  {(certs as CertificationResponse[]).map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5 p-3 bg-muted/40 rounded-xl border border-border">
                      <ShieldCheck className="size-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                        {c.issuingOrganization && <p className="text-[10px] text-muted-foreground truncate">{c.issuingOrganization}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} title={t("trainer.profile.editTitle")} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("trainer.profile.displayNameLabel")} <span className="text-destructive">*</span></label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t("trainer.profile.bio")}</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("trainer.profile.managedByGym")}
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} className="bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none">{t("common.actions.cancel")}</Button>
            <Button onClick={submit} disabled={save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">{save.isPending && <Loader2 className="size-4 animate-spin" />} {t("common.actions.save")}</Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
