"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Camera,
  Activity,
  AlertCircle,
  CheckCircle,
  Star,
  Loader2,
  Save,
} from "lucide-react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { authService } from "@/services/auth.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog } from "@/shared/components/ui/dialog";
import { toErrorMessage } from "@/shared/utils/error.util";
import type { AuthUser } from "@/services/auth.service";

import { ProfileSidebar } from "@/modules/user/components/profile-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Textarea } from "@/shared/components/ui/textarea";
import { useTranslations } from "next-intl";
import { roleLabelKey } from "@/shared/utils/enum-label.util";
import { initialsOf, UserAvatar } from "@/shared/components/common/user-avatar";
import { useFormatters } from "@/i18n/use-formatters";

function ProfileHeader({ user }: { user: AuthUser }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const { updateUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const displayName = user.fullName ?? user.username ?? "";

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await authService.uploadAvatar(file);
      updateUser(updated);
      toast({ type: "success", title: t("member.profile.avatarUpdated") });
    } catch (error) {
      toast({ type: "error", title: t("member.profile.uploadFailed"), description: toErrorMessage(error) });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex gap-6 items-start">
        <div className="relative shrink-0">
          <UserAvatar
            className="size-32 border-4 border-card shadow-md"
            src={user.avatarUrl}
            name={displayName}
            fallback={initialsOf(displayName, "U")}
            fallbackClassName="bg-primary text-3xl font-bold text-primary-foreground"
          />
          <label className="absolute bottom-1 right-1 bg-primary rounded-full p-2 shadow-md hover:bg-primary/90 transition-colors cursor-pointer">
            {uploading ? (
              <Loader2 className="size-3.5 text-white animate-spin" />
            ) : (
              <Camera className="size-3.5 text-white" />
            )}
            <input
              type="file"
              accept="image/*"
              aria-label={t("member.profile.changeAvatar")}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground truncate">{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("member.profile.memberSince")}{" "}
            {user.createdAt
              ? fmt.monthYear(user.createdAt)
              : "—"}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-muted text-success text-xs font-medium">
                <CheckCircle className="size-3" />
                {t("member.profile.emailVerified")}
              </span>
            ) : (
              <Link
                href="/resend-verification"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-muted text-warning text-xs font-medium hover:bg-warning-muted"
              >
                <AlertCircle className="size-3" />
                {t("member.profile.emailNotVerified")}
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Star className="size-3" />
              {t("member.profile.eliteTier")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonalInfoCard({ user }: { user: AuthUser }) {
  const t = useTranslations();
  const { toast } = useToast();
  const { updateUser } = useAuthStore();
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    // A-22 (audit 2026-07-17): đổi email làm BE reset emailVerified=false — lần login
    // sau bị chặn cho tới khi xác thực lại. Trước đây điều này diễn ra âm thầm.
    const emailChanged = !!email && email !== user.email;
    if (emailChanged && !window.confirm(t("member.profile.emailChangeWarning"))) {
      return;
    }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        fullName: fullName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        gender: (gender as AuthUser["gender"]) || undefined,
        location: location || undefined,
      });
      updateUser(updated);
      toast({
        type: "success",
        title: t("member.profile.infoUpdated"),
        description: emailChanged ? t("member.profile.checkNewInbox") : undefined,
      });
    } catch (error) {
      toast({ type: "error", title: t("member.profile.updateFailed"), description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <User className="size-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">{t("member.profile.personalInfo")}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("member.profile.fullName")}</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("member.profile.fullNamePlaceholder")}
            className="h-11 border-border rounded-lg text-base text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("member.profile.emailLabel")}</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-border rounded-lg text-base text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("common.table.phone")}</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 border-border rounded-lg text-base text-foreground"
            placeholder="0901 234 567"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("member.profile.roleLabel")}</label>
          <Input
            value={t(roleLabelKey(user.role))}
            readOnly
            className="h-11 border-border rounded-lg bg-muted/40 text-base text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("member.profile.genderLabel")}</label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger><SelectValue placeholder={t("member.profile.genderPlaceholder")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Nam</SelectItem>
              <SelectItem value="FEMALE">{t("member.profile.genderFemale")}</SelectItem>
              <SelectItem value="OTHER">{t("member.profile.genderOther")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("member.profile.locationLabel")}</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("gym.branches.cityPlaceholder")}
            className="h-11 border-border rounded-lg text-base text-foreground"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 rounded-lg gap-2"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("common.actions.saveChanges")}
        </Button>
      </div>
    </div>
  );
}

function FitnessMetricsCard({ user }: { user: AuthUser }) {
  const t = useTranslations();
  const { toast } = useToast();
  const { updateUser } = useAuthStore();
  const [height, setHeight] = useState(user.height?.toString() ?? "");
  const [weight, setWeight] = useState(user.weight?.toString() ?? "");
  const [mainGoal, setMainGoal] = useState(user.mainGoal ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        mainGoal: mainGoal || undefined,
      });
      updateUser(updated);
      toast({ type: "success", title: t("member.profile.metricsUpdated") });
    } catch (error) {
      toast({ type: "error", title: t("member.profile.updateFailed"), description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-primary rounded-xl p-6 shadow-md">
      <div className="flex items-center gap-3 mb-5">
        <Activity className="size-5 text-white" />
        <h2 className="text-lg font-semibold text-white">{t("member.profile.metricsTitle")}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-white/70">{t("member.profile.heightLabel")}</p>
          <Input
            type="text"
            inputMode="numeric"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="—"
            className="text-xl bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 border-primary-foreground/20 hover:border-primary-foreground/40 focus-visible:border-primary-foreground/60 focus-visible:ring-primary-foreground/20"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-white/70">{t("member.profile.weightLabel")}</p>
          <Input
            type="text"
            inputMode="numeric"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
            className="text-xl bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 border-primary-foreground/20 hover:border-primary-foreground/40 focus-visible:border-primary-foreground/60 focus-visible:ring-primary-foreground/20"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <p className="text-xs font-medium text-white/70">{t("member.profile.mainGoalLabel")}</p>
          <Input
            type="text"
            inputMode="text"
            value={mainGoal}
            onChange={(e) => setMainGoal(e.target.value)}
            placeholder={t("member.profile.mainGoalPlaceholder")}
            className="text-sm font-medium bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 border-primary-foreground/20 hover:border-primary-foreground/40 focus-visible:border-primary-foreground/60 focus-visible:ring-primary-foreground/20"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-card/15 hover:bg-card/25 text-white text-sm font-medium rounded-lg h-9 transition-colors"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {t("member.profile.saveMetrics")}
      </button>
    </div>
  );
}

function EmergencyContactCard({ user }: { user: AuthUser }) {
  const t = useTranslations();
  const { toast } = useToast();
  const { updateUser } = useAuthStore();
  const ec = user.emergencyContact;
  const [name, setName] = useState(ec?.name ?? "");
  const [relationship, setRelationship] = useState(ec?.relationship ?? "");
  const [phone, setPhone] = useState(ec?.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        emergencyContact: { name, relationship, phone },
      });
      updateUser(updated);
      toast({ type: "success", title: t("member.profile.emergencyUpdated") });
    } catch (error) {
      toast({ type: "error", title: t("member.profile.updateFailed"), description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <AlertCircle className="size-4 text-warning" />
        <h2 className="text-lg font-semibold text-foreground">{t("member.profile.emergencyTitle")}</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("member.profile.contactNameLabel")}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("member.profile.contactNamePlaceholder")}
            className="h-11 border-border rounded-lg text-base"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("member.profile.relationshipLabel")}</label>
          <Input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder={t("member.profile.relationshipPlaceholder")}
            className="h-11 border-border rounded-lg text-base"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t("common.table.phone")}</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901 234 567"
            className="h-11 border-border rounded-lg text-base"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-lg gap-2"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("member.profile.saveContact")}
        </Button>
      </div>
    </div>
  );
}

function FitnessPreferencesCard({ user }: { user: AuthUser }) {
  const t = useTranslations();
  const { toast } = useToast();
  const { updateUser } = useAuthStore();
  const fp = user.fitnessPreferences;
  const [styles, setStyles] = useState<string[]>(fp?.styles ?? []);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [styleInput, setStyleInput] = useState("");
  const [frequency, setFrequency] = useState(fp?.frequency ?? "4-5");
  const [equipmentAccess, setEquipmentAccess] = useState(fp?.equipmentAccess ?? "gym");
  const [injuries, setInjuries] = useState(fp?.injuries ?? "");
  const [saving, setSaving] = useState(false);

  function addStyle() {
    const val = styleInput.trim();
    if (val && !styles.includes(val)) setStyles((prev) => [...prev, val]);
    setStyleInput("");
    setStyleDialogOpen(false);
  }

  function removeStyle(s: string) {
    setStyles((prev) => prev.filter((x) => x !== s));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        fitnessPreferences: { styles, frequency, equipmentAccess, injuries },
      });
      updateUser(updated);
      toast({ type: "success", title: t("member.profile.prefsUpdated") });
    } catch (error) {
      toast({ type: "error", title: t("member.profile.updateFailed"), description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <Activity className="size-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">{t("member.profile.prefsTitle")}</h2>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 rounded-lg gap-2 text-sm"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("common.actions.save")}
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t("member.profile.favoriteStyles")}</p>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {s}
                <button type="button" onClick={() => removeStyle(s)} aria-label={t("member.profile.removeStyle")} title={t("member.profile.removeStyle")} className="cursor-pointer hover:text-destructive leading-none">×</button>
              </span>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-primary text-primary hover:bg-primary/10"
            onClick={() => { setStyleInput(""); setStyleDialogOpen(true); }}
          >
            {t("member.profile.addStyle")}
          </Button>
        </div>

        <Dialog
          open={styleDialogOpen}
          title={t("member.profile.addStyleTitle")}
          onClose={() => setStyleDialogOpen(false)}
        >
          <div className="space-y-4">
            <Input
              autoFocus
              value={styleInput}
              onChange={(e) => setStyleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStyle(); } }}
              placeholder={t("member.profile.addStylePlaceholder")}
              className="h-11"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStyleDialogOpen(false)}>{t("common.actions.cancel")}</Button>
              <Button
                onClick={addStyle}
                disabled={!styleInput.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >{t("common.actions.add")}</Button>
            </div>
          </div>
        </Dialog>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t("member.profile.frequencyLabel")}</p>
          <RadioGroup value={frequency} onValueChange={setFrequency} className="space-y-2">
            {[
              { value: "4-5", label: t("member.profile.freq.4-5") },
              { value: "daily", label: t("member.profile.freq.daily") },
              { value: "2-3", label: t("member.profile.freq.2-3") },
            ].map(({ value, label }) => (
              <div key={value} className="flex items-center gap-2">
                <RadioGroupItem id={`freq-${value}`} value={value} className="cursor-pointer" />
                <label
                  htmlFor={`freq-${value}`}
                  className="cursor-pointer select-none text-sm text-foreground"
                >
                  {label}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t("member.profile.equipmentLabel")}</p>
          <Select value={equipmentAccess} onValueChange={setEquipmentAccess}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gym">{t("member.profile.equip.gym")}</SelectItem>
              <SelectItem value="home">{t("member.profile.equip.home")}</SelectItem>
              <SelectItem value="outdoor">{t("member.profile.equip.outdoor")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t("member.profile.injuriesLabel")}</p>
          <Textarea
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            placeholder={t("member.profile.injuriesPlaceholder")}
            maxLength={500}
            className="h-24 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-10 xl:px-20">
        <ProfileSidebar />

        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <ProfileHeader user={user} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <PersonalInfoCard user={user} />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-4">
              <FitnessMetricsCard user={user} />
              <EmergencyContactCard user={user} />
            </div>
          </div>

          <FitnessPreferencesCard user={user} />
        </main>
      </div>
    </div>
  );
}

