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

/** UC-017 (B-11): chính sách đặt lịch/hủy/no-show/nội quy — BE có sẵn, trước đây FE = 0. */
function PoliciesSection() {
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
    onSuccess: () => toast({ type: "success", title: "Đã lưu chính sách" }),
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) }),
  });

  const fields: Array<{ key: keyof GymPolicy; label: string; placeholder: string }> = [
    { key: "bookingPolicy", label: "Chính sách đặt lịch", placeholder: "Vd: Đặt trước tối thiểu 2 giờ, mỗi khách tối đa 2 buổi/ngày..." },
    { key: "cancellationPolicy", label: "Chính sách hủy lịch", placeholder: "Vd: Hủy trước 24h miễn phí; hủy muộn mất phí đặt cọc..." },
    { key: "noShowPolicy", label: "Chính sách vắng mặt (no-show)", placeholder: "Vd: Vắng mặt không báo trước sẽ không được hoàn tiền..." },
    { key: "houseRules", label: "Nội quy phòng tập", placeholder: "Vd: Mang giày thể thao, giữ vệ sinh chung..." },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
        <ScrollText className="size-4 text-primary" /> Chính sách & nội quy
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Hiển thị cho khách khi đặt lịch. Quy tắc tài chính (cọc %, giờ hủy miễn phí) cấu hình theo từng dịch vụ/gói.
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
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
              {save.isPending && <Loader2 className="size-4 animate-spin" />} Lưu chính sách
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymSettingsPage() {
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
    onSuccess: () => toast({ type: "success", title: "Đã cập nhật hồ sơ phòng gym" }),
    onError: (e) => toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) })
  });

  const saveVisibility = useMutation({
    mutationFn: (v: boolean) => gymService.setVisibility(v),
    onSuccess: (_d, v) => toast({ type: "success", title: v ? "Đã hiển thị trên marketplace" : "Đã ẩn khỏi marketplace" }),
    onError: (e, v) => {
      // Đảo lại toggle khi BE từ chối (vd chưa APPROVED, chưa có branch active).
      setVisible(!v);
      toast({ type: "error", title: "Lỗi", description: toErrorMessage(e) });
    },
  });

  const notApproved = !!status && status.verificationStatus !== "APPROVED";

  function submit() {
    if (!gymName.trim()) { toast({ type: "warning", title: "Nhập tên phòng gym" }); return; }
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
          <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
          <p className="text-sm text-muted-foreground mt-1">Cập nhật hồ sơ công khai và trạng thái hiển thị của phòng gym.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-4"><Building2 className="size-4 text-primary" /> Hồ sơ phòng gym</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tên phòng gym <span className="text-red-500">*</span></label>
                  <Input value={gymName} onChange={e => setGymName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mô tả</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Địa chỉ</label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Thành phố</label>
                    <Input value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Số điện thoại</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={submit} disabled={saveProfile.isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                    {saveProfile.isPending && <Loader2 className="size-4 animate-spin" />} Lưu hồ sơ
                  </Button>
                </div>
              </div>
            </div>

            <PoliciesSection />

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-4"><Eye className="size-4 text-primary" /> Hiển thị trên marketplace</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Cho phép khách hàng tìm thấy phòng gym</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {notApproved
                      ? "Chỉ khả dụng sau khi hồ sơ được duyệt (và có ít nhất 1 chi nhánh hoạt động)."
                      : "Bật để hồ sơ hiển thị công khai trên trang tìm kiếm."}
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
