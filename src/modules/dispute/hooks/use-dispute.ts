"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disputeService,
  DisputeEvidenceRequest,
  DisputeStatus,
  ResolveDisputeRequest,
} from "@/services/dispute.service";

const keys = {
  all: ["disputes"] as const,
  mine: ["disputes", "mine"] as const,
  queue: (status?: DisputeStatus) => ["disputes", "queue", status] as const,
  evidence: (id: number) => ["disputes", id, "evidence"] as const,
};

const refresh = (c: ReturnType<typeof useQueryClient>) => () =>
  c.invalidateQueries({ queryKey: keys.all });

// ---- Parties ----
export function useMyDisputes() {
  return useQuery({ queryKey: keys.mine, queryFn: () => disputeService.getMine() });
}

// Mở tranh chấp: dùng useOpenTicketDispute ở modules/ticket — vé/buổi tập đi
// trong đường dẫn nên không còn payload mang id.

export function useDisputeEvidence(id: number, admin = false) {
  return useQuery({
    queryKey: [...keys.evidence(id), admin],
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
    queryKey: keys.queue(status),
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
