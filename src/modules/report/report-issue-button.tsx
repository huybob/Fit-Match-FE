"use client";

import { useMutation } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast-provider";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  issueReportService,
  type IssueTargetType,
} from "@/services/issue-report.service";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";

const REPORTER_ROLES = ["ROLE_CUSTOMER", "ROLE_GYM_OPERATOR", "ROLE_PT"];

/**
 * UC-070: nút "Báo cáo vấn đề" cho Gym/PT/Booking — chỉ hiện với người đăng nhập
 * thuộc 3 vai trò được phép báo cáo (khớp @PreAuthorize BE).
 */
export function ReportIssueButton({
  targetType,
  targetId,
  targetName,
}: {
  targetType: IssueTargetType;
  targetId: number;
  targetName?: string;
}) {
  const { toast } = useToast();
  const { user, status } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const mut = useMutation({
    mutationFn: () => issueReportService.create({ targetType, targetId, reason: reason.trim() }),
    onSuccess: () => {
      toast({ type: "success", title: "Đã gửi báo cáo", description: "Đội kiểm duyệt sẽ xem xét sớm nhất." });
      setOpen(false);
      setReason("");
    },
    onError: (e) => toast({ type: "error", title: "Không gửi được báo cáo", description: toErrorMessage(e) }),
  });

  if (status !== "authenticated" || !user?.role || !REPORTER_ROLES.includes(user.role)) {
    return null;
  }

  function submit() {
    if (reason.trim().length < 10) {
      toast({ type: "warning", title: "Mô tả vấn đề tối thiểu 10 ký tự" });
      return;
    }
    if (reason.trim().length > 1000) {
      toast({ type: "warning", title: "Mô tả tối đa 1000 ký tự" });
      return;
    }
    mut.mutate();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Flag className="size-3.5" /> Báo cáo vấn đề
      </Button>

      <Dialog open={open} title={`Báo cáo vấn đề${targetName ? ` — ${targetName}` : ""}`} onClose={() => setOpen(false)}>
        <p className="text-sm text-muted-foreground">
          Mô tả vấn đề bạn gặp phải (hành vi, chất lượng dịch vụ, nội dung sai phạm...).
          Báo cáo được gửi tới đội kiểm duyệt của nền tảng.
        </p>
        <Textarea
          className="mt-3"
          rows={4}
          maxLength={1000}
          placeholder="Tối thiểu 10 ký tự..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
          <Button
            disabled={mut.isPending}
            className="bg-primary text-white hover:bg-primary/90"
            onClick={submit}
          >
            {mut.isPending ? "Đang gửi..." : "Gửi báo cáo"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
