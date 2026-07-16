"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BranchRequest,
  FacilityRequest,
  gymService,
  GymRequest,
  GymSearchParams,
  PartnershipActionRequest,
} from "@/services/gym.service";
import { gymKeys } from "../query-keys";

function invalidate(client: ReturnType<typeof useQueryClient>) {
  return () => client.invalidateQueries({ queryKey: gymKeys.all });
}
export function useSearchGyms(params: GymSearchParams) {
  return useQuery({
    queryKey: gymKeys.search(params),
    queryFn: () => gymService.search(params),
  });
}
export function useGymDetail(id: number) {
  return useQuery({
    queryKey: gymKeys.detail(id),
    queryFn: () => gymService.getDetail(id),
    enabled: id > 0,
  });
}
export function useMyGyms() {
  return useQuery({
    queryKey: gymKeys.mine(),
    queryFn: () => gymService.getMine(),
  });
}
export function useCreateGym() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (p: GymRequest) => gymService.create(p),
    onSuccess: invalidate(c),
  });
}
export function useUpdateGym() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GymRequest }) =>
      gymService.update(id, payload),
    onSuccess: invalidate(c),
  });
}
export function useSetGymOpen() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, open }: { id: number; open: boolean }) =>
      open ? gymService.reopen(id) : gymService.close(id),
    onSuccess: invalidate(c),
  });
}
export function useUploadGymImage() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      kind,
    }: {
      id: number;
      file: File;
      kind: "logo" | "cover";
    }) =>
      kind === "logo"
        ? gymService.uploadLogo(id, file)
        : gymService.uploadCover(id, file),
    onSuccess: invalidate(c),
  });
}
export function useGymBranches(id: number) {
  return useQuery({
    queryKey: gymKeys.branches(id),
    queryFn: () => gymService.getBranches(id),
    enabled: id > 0,
  });
}
export function useCreateBranch() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({
      gymId,
      payload,
    }: {
      gymId: number;
      payload: BranchRequest;
    }) => gymService.createBranch(gymId, payload),
    onSuccess: invalidate(c),
  });
}
export function useUpdateBranch() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({
      gymId,
      id,
      payload,
    }: {
      gymId: number;
      id: number;
      payload: BranchRequest;
    }) => gymService.updateBranch(gymId, id, payload),
    onSuccess: invalidate(c),
  });
}
export function useDeleteBranch() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ gymId, id }: { gymId: number; id: number }) =>
      gymService.deleteBranch(gymId, id),
    onSuccess: invalidate(c),
  });
}
export function useGymFacilities(id: number) {
  return useQuery({
    queryKey: gymKeys.facilities(id),
    queryFn: () => gymService.getFacilities(id),
    enabled: id > 0,
  });
}
export function useCreateFacility() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({
      gymId,
      payload,
    }: {
      gymId: number;
      payload: FacilityRequest;
    }) => gymService.createFacility(gymId, payload),
    onSuccess: invalidate(c),
  });
}
export function useUpdateFacility() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({
      gymId,
      id,
      payload,
    }: {
      gymId: number;
      id: number;
      payload: FacilityRequest;
    }) => gymService.updateFacility(gymId, id, payload),
    onSuccess: invalidate(c),
  });
}
export function useDeleteFacility() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ gymId, id }: { gymId: number; id: number }) =>
      gymService.deleteFacility(gymId, id),
    onSuccess: invalidate(c),
  });
}
export function useGymPartnerships() {
  return useQuery({
    queryKey: gymKeys.partnerships(),
    queryFn: () => gymService.getPartnerships(),
  });
}
export function usePartnershipAction() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      payload = {},
    }: {
      id: number;
      action: "approve" | "reject" | "end";
      payload?: PartnershipActionRequest;
    }) =>
      action === "approve"
        ? gymService.approvePartnership(id, payload)
        : action === "reject"
          ? gymService.rejectPartnership(id, payload)
          : gymService.endPartnership(id),
    onSuccess: invalidate(c),
  });
}
