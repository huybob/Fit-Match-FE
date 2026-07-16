"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareReply, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { useGetMyTrainerProfile } from "@/modules/trainer/hooks/use-trainer";
import type { Review } from "@/services/review.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useBookings } from "@/modules/booking/hooks/use-booking";
import {
  useDeleteReview,
  useReplyReview,
  useReviews,
  useSaveReview,
} from "../hooks/use-review";
import { replySchema, reviewSchema } from "../schemas";

export function CustomerReviewsPage() {
  return <ReviewPage scope="customer" />;
}

export function TrainerReviewsPage() {
  const q = useGetMyTrainerProfile();
  if (q.isLoading) return <LoadingSkeleton />;
  return <ReviewPage scope="pt" targetId={q.data?.id ?? 0} />;
}

export function GymReviewsPage() {
  // getGymOwn trả review của mọi gym thuộc operator (mọi trạng thái) — không cần chọn gym.
  return <ReviewPage scope="gym" />;
}

const reviewStatusLabels: Record<string, string> = {
  VISIBLE: "Hiển thị",
  HIDDEN: "Đã ẩn",
  REMOVED: "Đã gỡ",
};

const scopeTitles: Record<string, string> = {
  customer: "Đánh giá của tôi",
  pt: "Đánh giá của huấn luyện viên",
  gym: "Đánh giá phòng gym",
};

const scopeDescriptions: Record<string, string> = {
  customer: "Xem và quản lý các đánh giá bạn đã gửi.",
  pt: "Xem các đánh giá từ khách hàng về bạn.",
  gym: "Xem các đánh giá từ khách hàng về phòng gym.",
};

function ReviewPage({
  scope,
  targetId = 0,
}: {
  scope: "customer" | "pt" | "gym";
  targetId?: number;
}) {
  const [editing, setEditing] = useState<Review | null | undefined>();
  const [replying, setReplying] = useState<Review | null>(null);
  const query = useReviews(scope, targetId);
  const del = useDeleteReview();
  const { toast } = useToast();
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="mb-6 flex items-end justify-between rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <h1 className="text-3xl font-black">{scopeTitles[scope] ?? scope}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {scopeDescriptions[scope] ?? ""}
          </p>
        </div>
        {scope === "customer" && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            Viết đánh giá
          </Button>
        )}
      </section>

      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState
          title="Không thể tải đánh giá"
          description={toErrorMessage(query.error)}
        />
      ) : !items.length ? (
        <EmptyState
          title="Chưa có đánh giá"
          description="Chưa có đánh giá nào được ghi lại."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex justify-between">
                <p className="font-black">{r.customerName}</p>
                <span className="flex items-center gap-1 font-black text-accent">
                  <Star className="size-4 fill-current" />
                  {r.rating}/5
                </span>
              </div>
              {scope === "gym" && r.status !== "VISIBLE" && (
                <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                  {reviewStatusLabels[r.status] ?? r.status}
                </span>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {r.comment || "Không có nội dung"}
              </p>
              {r.reply && (
                <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
                  <b>{r.repliedByName}:</b> {r.reply}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                {scope === "customer" ? (
                  <>
                    <Button onClick={() => setEditing(r)}>
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        await del.mutateAsync(r.id!);
                        toast({ type: "success", title: "Đã xóa đánh giá" });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setReplying(r)}>
                    <MessageSquareReply className="size-4" />
                    Phản hồi
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ReviewDialog review={editing} onClose={() => setEditing(undefined)} />
      )}
      {replying && (
        <ReplyDialog review={replying} onClose={() => setReplying(null)} />
      )}
    </div>
  );
}

function ReviewDialog({
  review,
  onClose,
}: {
  review: Review | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const save = useSaveReview();
  const bookingsQuery = useBookings("customer", {
    status: "COMPLETED",
    page: 0,
    size: 50,
  });
  const completed = bookingsQuery.data?.content ?? [];
  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookingId: review?.bookingId ?? 0,
      rating: review?.rating ?? 5,
      comment: review?.comment ?? "",
    },
  });

  return (
    <Dialog
      open
      title={review ? "Sửa đánh giá" : "Viết đánh giá"}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await save.mutateAsync({ id: review?.id, payload: v });
            toast({ type: "success", title: "Đã lưu đánh giá" });
            onClose();
          } catch (e) {
            toast({
              type: "error",
              title: "Yêu cầu thất bại",
              description: toErrorMessage(e),
            });
          }
        })}
      >
        <FieldShell label="Buổi đặt lịch">
          {review ? (
            <Input
              disabled
              value={`#${review.bookingId} · ${review.ptName ?? ""}`}
            />
          ) : bookingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Đang xử lý...
            </p>
          ) : !completed.length ? (
            <p className="text-sm text-muted-foreground">
              Không có buổi đã hoàn thành
            </p>
          ) : (
            <Controller
              control={form.control}
              name="bookingId"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn buổi đặt lịch" />
                  </SelectTrigger>
                  <SelectContent>
                    {completed.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        #{b.id} · {b.serviceName ?? b.packageName ?? ""} · {b.ptDisplayName ?? ""} · {b.startAt ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FieldShell>
        <FieldShell label="Điểm đánh giá">
          <Controller
            control={form.control}
            name="rating"
            render={({ field }) => (
              <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((v) => (
                    <SelectItem key={v} value={String(v)}>{v}/5</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>
        <FieldShell label="Nội dung">
          <Textarea {...form.register("comment")} />
        </FieldShell>
        <Button>Lưu thay đổi</Button>
      </form>
    </Dialog>
  );
}

function ReplyDialog({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const mutation = useReplyReview();
  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { reply: review.reply ?? "" },
  });

  return (
    <Dialog open title="Phản hồi" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync({ id: review.id!, reply: v.reply });
            toast({ type: "success", title: "Đã gửi phản hồi" });
            onClose();
          } catch (e) {
            toast({
              type: "error",
              title: "Yêu cầu thất bại",
              description: toErrorMessage(e),
            });
          }
        })}
      >
        <FieldShell label="Phản hồi">
          <Textarea {...form.register("reply")} />
        </FieldShell>
        <Button>Gửi phản hồi</Button>
      </form>
    </Dialog>
  );
}
