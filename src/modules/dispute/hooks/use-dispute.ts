"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disputeService,
  DisputeEvidenceRequest,
  DisputeStatus,
  ResolveDisputeRequest,
} from "@/services/dispute.service";

/**
 * Export vì tranh chấp được MỞ từ module ticket (đường dẫn mang ticketId) —
 * mutation ở đó phải làm mới danh sách này, nếu không vé vừa tranh chấp vẫn
 * hiện nút "Mở tranh chấp" cho tới lần tải trang sau.
 */
export const disputeKeys = {
  all: ["disputes"] as const,
  mine: ["disputes", "mine"] as const,
  queue: (status?: DisputeStatus) => ["disputes", "queue", status] as const,
  evidence: (id: number) => ["disputes", id, "evidence"] as const,
};

const refresh = (c: ReturnType<typeof useQueryClient>) => () =>
  c.invalidateQueries({ queryKey: disputeKeys.all });

// ---- Parties ----
export function useMyDisputes() {
  return useQuery({ queryKey: disputeKeys.mine, queryFn: () => disputeService.getMine() });
}

// Mở tranh chấp: dùng useOpenTicketDispute ở modules/ticket — vé/buổi tập đi
// trong đường dẫn nên không còn payload mang id.

export function useDisputeEvidence(id: number, admin = false) {
  return useQuery({
    queryKey: [...disputeKeys.evidence(id), admin],
    queryFn: () => (admin ? disputeService.adminEvidence(id) : disputeService.evidence(id)),
    enabled: id > 0,
  });
}

export function useAddEvidence() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DisputeEvidenceRequest }) =>
      disputeService.addEvidence(id, payload),
    onSuccess: refresh(c),
  });
}

// ---- Moderator/Admin ----
export function useDisputeQueue(status?: DisputeStatus) {
  return useQuery({
    queryKey: disputeKeys.queue(status),
    queryFn: () => disputeService.getQueue(status),
  });
}

export function useDisputeDecision() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, payload, note }: {
      id: number;
      action: "review" | "resolve" | "close" | "escalate";
      payload?: ResolveDisputeRequest;
      note?: string;
    }) => {
      switch (action) {
        case "review":
          return disputeService.review(id);
        case "resolve":
          return disputeService.resolve(id, payload!);
        case "close":
          return disputeService.close(id, note);
        case "escalate":
          return disputeService.escalate(id, note);
      }
    },
    onSuccess: refresh(c),
  });
}
