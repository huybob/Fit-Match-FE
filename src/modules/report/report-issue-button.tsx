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
import { useTranslations } from "next-intl";

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
  const t = useTranslations();
  const { toast } = useToast();
  const { user, status } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const mut = useMutation({
    mutationFn: () => issueReportService.create({ targetType, targetId, reason: reason.trim() }),
    onSuccess: () => {
      toast({ type: "success", title: t("report.sent"), description: t("report.sentDesc") });
      setOpen(false);
      setReason("");
    },
    onError: (e) => toast({ type: "error", title: t("report.failed"), description: toErrorMessage(e) }),
  });

  if (status !== "authenticated" || !user?.role || !REPORTER_ROLES.includes(user.role)) {
    return null;
  }

  function submit() {
    if (reason.trim().length < 10) {
      toast({ type: "warning", title: t("report.minLength") });
      return;
    }
    if (reason.trim().length > 1000) {
      toast({ type: "warning", title: t("report.maxLength") });
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
        <Flag className="size-3.5" /> {t("report.button")}
      </Button>

      <Dialog open={open} title={targetName ? t("report.dialogTitleFor", { name: targetName }) : t("report.dialogTitle")} onClose={() => setOpen(false)}>
        <p className="text-sm text-muted-foreground">
          {t("report.hint")}
          {t("report.hint2")}
        </p>
        <Textarea
          className="mt-3"
          rows={4}
          maxLength={1000}
          placeholder={t("report.placeholder")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>{t("common.actions.cancel")}</Button>
          <Button
            disabled={mut.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={submit}
          >
            {mut.isPending ? t("common.states.submitting") : t("report.submit")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
