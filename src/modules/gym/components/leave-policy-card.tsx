"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { shiftService } from "@/services/shift.service";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { leaveKeys } from "../shift-query-keys";

/**
 * Hạn mức đơn nghỉ mỗi tháng cho một PT (BE §4.2). Mặc định TẮT = không giới
 * hạn; bật là một lựa chọn có ý thức của Gym, không phải trạng thái mặc nhiên.
 */
export function LeavePolicyCard() {
  const t = useTranslations("gymLeave");
  const { toast } = useToast();
  const client = useQueryClient();

  const { data } = useQuery({
    queryKey: leaveKeys.policy(),
    queryFn: () => shiftService.leavePolicy(),
  });

  const [enabled, setEnabled] = useState(false);
  const [quota, setQuota] = useState(4);

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setQuota(data.monthlyQuota ?? 4);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      shiftService.updateLeavePolicy({ enabled, monthlyQuota: enabled ? quota : null }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: leaveKeys.policy() });
      toast({ type: "success", title: t("policySaved") });
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  return (
    <section className="space-y-4 rounded-md border p-4">
      <div>
        <h2 className="text-lg font-semibold">{t("policyTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("policyHint")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Switch id="quota-enabled" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="quota-enabled">{t("policyEnabled")}</Label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="quota-value">{t("policyQuota")}</Label>
          <Input
            id="quota-value"
            type="number"
            min={1}
            max={31}
            className="w-28"
            disabled={!enabled}
            value={quota}
            onChange={(event) => setQuota(Number(event.target.value))}
          />
        </div>

        <Button disabled={save.isPending} onClick={() => save.mutate()}>
          {t("policySave")}
        </Button>
      </div>

      {!enabled ? <p className="text-xs text-muted-foreground">{t("policyDisabled")}</p> : null}
    </section>
  );
}
