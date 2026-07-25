"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Heart,
  User,
  Shield,
  Settings,
  LogOut,
  Camera,
  Activity,
  AlertCircle,
  CheckCircle,
  Star,
  Loader2,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";
import { authService } from "@/services/auth.service";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog } from "@/shared/components/ui/dialog";
import { toErrorMessage } from "@/shared/utils/error.util";
import type { AuthUser } from "@/services/auth.service";

import { ProfileSidebar } from "@/modules/user/components/profile-sidebar";

function ProfileHeader({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const { updateUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const displayName = user.fullName ?? user.username ?? "";
  const initials = displayName
    ? displayName.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("")
    : "U";

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await authService.uploadAvatar(file);
      updateUser(updated);
      toast({ type: "success", title: "Cập nhật ảnh đại diện thành công!" });
    } catch (error) {
      toast({ type: "error", title: "Upload thất bại", description: toErrorMessage(error) });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex gap-6 items-start">
        <div className="relative shrink-0">
          <div className="size-32 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="size-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{initials}</span>
            )}
          </div>
          <label className="absolute bottom-1 right-1 bg-primary rounded-full p-2 shadow-md hover:bg-primary/90 transition-colors cursor-pointer">
            {uploading ? (
              <Loader2 className="size-3.5 text-white animate-spin" />
            ) : (
              <Camera className="size-3.5 text-white" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground truncate">{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thành viên từ{" "}
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
              : "—"}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-medium">
                <CheckCircle className="size-3" />
                Đã xác thực Email
              </span>
            ) : (
              <Link
                href="/resend-verification"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium hover:bg-yellow-100"
              >
                <AlertCircle className="size-3" />
                Chưa xác thực email
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Star className="size-3" />
              Hạng Elite
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonalInfoCard({ user }: { user: AuthUser }) {
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
    if (emailChanged && !window.confirm(
      "Đổi email sẽ yêu cầu xác thực lại: hệ thống gửi link xác thực tới email MỚI, "
      + "và bạn không đăng nhập được cho tới khi bấm link đó. Tiếp tục?",
    )) {
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
        title: "Cập nhật thông tin thành công!",
        description: emailChanged ? "Kiểm tra hộp thư email mới để xác thực lại tài khoản." : undefined,
      });
    } catch (error) {
      toast({ type: "error", title: "Cập nhật thất bại", description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <User className="size-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Thông tin cá nhân</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nhập họ và tên"
            className="h-11 border-border rounded-lg text-base text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Địa chỉ Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-border rounded-lg text-base text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 border-border rounded-lg text-base text-foreground"
            placeholder="0901 234 567"
          />
          {/* UC-002: xác minh SĐT bằng OTP — đổi SĐT sẽ phải xác minh lại */}
          <PhoneVerifyRow user={user} currentInput={phone} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Vai trò</label>
          <Input
            value={
              {
                ROLE_CUSTOMER: "Khách hàng",
                ROLE_PT: "Huấn luyện viên",
                ROLE_GYM_OPERATOR: "Quản lý phòng gym",
                ROLE_ADMIN: "Quản trị viên",
              }[user.role ?? "ROLE_CUSTOMER"] ?? user.role
            }
            readOnly
            className="h-11 border-border rounded-lg bg-muted/40 text-base text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full h-11 border border-border rounded-lg px-3 text-base text-foreground bg-card"
          >
            <option value="">Chọn giới tính</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Địa điểm</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="TP. Hồ Chí Minh"
            className="h-11 border-border rounded-lg text-base text-foreground"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white h-10 px-6 rounded-lg gap-2"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}

function FitnessMetricsCard({ user }: { user: AuthUser }) {
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
      toast({ type: "success", title: "Cập nhật chỉ số thành công!" });
    } catch (error) {
      toast({ type: "error", title: "Cập nhật thất bại", description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-primary rounded-xl p-6 shadow-md">
      <div className="flex items-center gap-3 mb-5">
        <Activity className="size-5 text-white" />
        <h2 className="text-lg font-semibold text-white">Chỉ số thể hình</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-white/70">Chiều cao (cm)</p>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="—"
            className="w-full bg-card/10 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-xl font-normal border border-white/20 focus:outline-none focus:border-white/60"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-white/70">Cân nặng (kg)</p>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
            className="w-full bg-card/10 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-xl font-normal border border-white/20 focus:outline-none focus:border-white/60"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <p className="text-xs font-medium text-white/70">Mục tiêu chính</p>
          <input
            type="text"
            value={mainGoal}
            onChange={(e) => setMainGoal(e.target.value)}
            placeholder="Phát triển cơ bắp..."
            className="w-full bg-card/10 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm font-medium border border-white/20 focus:outline-none focus:border-white/60"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-card/15 hover:bg-card/25 text-white text-sm font-medium rounded-lg h-9 transition-colors"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Lưu chỉ số
      </button>
    </div>
  );
}

function EmergencyContactCard({ user }: { user: AuthUser }) {
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
      toast({ type: "success", title: "Cập nhật liên hệ khẩn cấp thành công!" });
    } catch (error) {
      toast({ type: "error", title: "Cập nhật thất bại", description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <AlertCircle className="size-4 text-amber-500" />
        <h2 className="text-lg font-semibold text-foreground">Liên hệ khẩn cấp</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Tên người liên hệ</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nguyễn Văn B"
            className="h-11 border-border rounded-lg text-base"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Mối quan hệ</label>
          <Input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Vợ/Chồng"
            className="h-11 border-border rounded-lg text-base"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
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
          className="w-full bg-primary hover:bg-primary/90 text-white h-10 rounded-lg gap-2"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu liên hệ
        </Button>
      </div>
    </div>
  );
}

function FitnessPreferencesCard({ user }: { user: AuthUser }) {
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
      toast({ type: "success", title: "Cập nhật sở thích tập luyện thành công!" });
    } catch (error) {
      toast({ type: "error", title: "Cập nhật thất bại", description: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <Activity className="size-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">Sở thích tập luyện</h2>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white h-9 px-4 rounded-lg gap-2 text-sm"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Phong cách yêu thích</p>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {s}
                <button onClick={() => removeStyle(s)} className="hover:text-destructive leading-none">×</button>
              </span>
            ))}
          </div>
          <button
            onClick={() => { setStyleInput(""); setStyleDialogOpen(true); }}
            className="px-3 h-8 rounded-lg border border-[#004ac6] text-primary text-xs font-medium hover:bg-primary/10"
          >
            + Thêm
          </button>
        </div>

        <Dialog
          open={styleDialogOpen}
          title="Thêm phong cách tập luyện"
          onClose={() => setStyleDialogOpen(false)}
        >
          <div className="space-y-4">
            <Input
              autoFocus
              value={styleInput}
              onChange={(e) => setStyleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStyle(); } }}
              placeholder="VD: HIIT, Yoga, Cử tạ..."
              className="h-11"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStyleDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={addStyle}
                disabled={!styleInput.trim()}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Thêm
              </Button>
            </div>
          </div>
        </Dialog>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Tần suất</p>
          <div className="space-y-2">
            {[
              { value: "4-5", label: "4-5 ngày/tuần" },
              { value: "daily", label: "Hàng ngày" },
              { value: "2-3", label: "2-3 ngày/tuần" },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="freq"
                  value={value}
                  checked={frequency === value}
                  onChange={() => setFrequency(value)}
                  className="accent-[#004ac6]"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Tiếp cận thiết bị</p>
          <select
            value={equipmentAccess}
            onChange={(e) => setEquipmentAccess(e.target.value)}
            className="w-full h-11 border border-border rounded-lg px-3 text-base text-foreground bg-card"
          >
            <option value="gym">Phòng Gym chuyên nghiệp</option>
            <option value="home">Tại nhà</option>
            <option value="outdoor">Ngoài trời</option>
          </select>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Chấn thương/Lưu ý</p>
          <textarea
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            placeholder={"Ví dụ: Đau lưng nhẹ,\ndị ứng hạt..."}
            className="w-full h-24 border border-border rounded-lg p-3 text-base text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
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
      <div className="flex gap-6 px-20 py-6">
        <ProfileSidebar />

        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <ProfileHeader user={user} />

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <PersonalInfoCard user={user} />
            </div>
            <div className="col-span-4 flex flex-col gap-6">
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

/** UC-002: trạng thái xác minh SĐT + dialog nhập OTP (mã gửi qua SMS, dev đọc từ log BE). */
function PhoneVerifyRow({ user, currentInput }: { user: AuthUser; currentInput: string }) {
  const { toast } = useToast();
  const { updateUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Chỉ hiện khi SĐT trên form khớp SĐT đã lưu (đổi số thì phải Lưu trước rồi mới xác minh)
  const phoneSaved = !!user.phone && currentInput === user.phone;

  if (!phoneSaved) return null;

  if (user.phoneVerified) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle className="size-3.5" /> SĐT đã xác minh
      </p>
    );
  }

  async function requestOtp() {
    setSending(true);
    try {
      await authService.requestPhoneOtp();
      setCode("");
      setOpen(true);
      toast({ type: "success", title: "Đã gửi mã OTP", description: "Mã 6 chữ số có hiệu lực 10 phút." });
    } catch (error) {
      toast({ type: "error", title: "Không gửi được OTP", description: toErrorMessage(error) });
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code)) {
      toast({ type: "warning", title: "Mã OTP gồm 6 chữ số" });
      return;
    }
    setVerifying(true);
    try {
      const updated = await authService.verifyPhoneOtp(code);
      updateUser(updated);
      setOpen(false);
      toast({ type: "success", title: "Đã xác minh số điện thoại" });
    } catch (error) {
      toast({ type: "error", title: "Xác minh thất bại", description: toErrorMessage(error) });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={requestOtp}
        disabled={sending}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
      >
        <AlertCircle className="size-3.5" />
        {sending ? "Đang gửi mã..." : "Chưa xác minh — gửi mã OTP"}
      </button>

      <Dialog open={open} title="Xác minh số điện thoại" onClose={() => setOpen(false)}>
        <p className="text-sm text-muted-foreground">
          Nhập mã 6 chữ số đã gửi tới <b>{user.phone}</b>. Sai 5 lần sẽ phải xin mã mới.
        </p>
        <Input
          className="mt-3 h-11 text-center text-xl tracking-[0.5em] font-bold"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={requestOtp}
            disabled={sending}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            Gửi lại mã
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button
              disabled={verifying || code.length !== 6}
              className="bg-primary text-white hover:bg-primary/90"
              onClick={verify}
            >
              {verifying ? "Đang kiểm tra..." : "Xác minh"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
