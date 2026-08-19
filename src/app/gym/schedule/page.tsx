"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { gymService } from "@/services/gym.service";
import { LeavePolicyCard } from "@/modules/gym/components/leave-policy-card";
import { LeaveRequestReview } from "@/modules/gym/components/leave-request-review";
import { ShiftManager } from "@/modules/gym/components/shift-manager";
import { ShiftRoster } from "@/modules/gym/components/shift-roster";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

/**
 * Trung tâm điều hành lịch PT của Gym (BE V85-V89): khai ca cho chi nhánh, xếp
 * PT vào ca, duyệt đơn nghỉ.
 *
 * Gom ba việc vào một trang vì chúng là một chuỗi thao tác liên tục — Gym duyệt
 * đơn nghỉ xong thường phải xếp người khác vào ca đó ngay. Chọn chi nhánh ở cấp
 * trang vì cả ca lẫn lưới phân ca đều gắn với chi nhánh.
 */
export default function GymSchedulePage() {
  const t = useTranslations("gymSchedule");
  const tTabs = useTranslations("gymSchedule.tabs");
  const [branchId, setBranchId] = useState<string>("");

  const { data: branches } = useQuery({
    queryKey: ["gym-branches", "for-schedule"],
    queryFn: () => gymService.listOwnBranches(),
  });

  useEffect(() => {
    if (!branchId && branches && branches.length > 0) {
      setBranchId(String(branches[0].id));
    }
  }, [branches, branchId]);

  const selected = Number(branchId || 0);

  return (
    <main className="flex-1 min-w-0 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t("pickBranch")} />
            </SelectTrigger>
            <SelectContent>
              {(branches ?? []).map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("noBranch")}
          </p>
        ) : (
          <Tabs defaultValue="roster">
            <TabsList>
              <TabsTrigger value="roster">{tTabs("roster")}</TabsTrigger>
              <TabsTrigger value="shifts">{tTabs("shifts")}</TabsTrigger>
              <TabsTrigger value="leave">{tTabs("leave")}</TabsTrigger>
            </TabsList>

            <TabsContent value="roster" className="pt-4">
              <ShiftRoster branchId={selected} />
            </TabsContent>

            <TabsContent value="shifts" className="pt-4">
              <ShiftManager branchId={selected} />
            </TabsContent>

            <TabsContent value="leave" className="space-y-6 pt-4">
              <LeaveRequestReview />
              <LeavePolicyCard />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
