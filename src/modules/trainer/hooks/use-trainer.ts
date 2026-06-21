"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AvailabilityRequest,
  CertificateRequest,
  PartnershipRequest,
  trainerService,
  TrainerServiceRequest,
  UpdatePtProfileRequest,
} from "@/services/trainer.service";
import { trainerKeys } from "../query-keys";

export function useGetPublicTrainer(userId: number) {
  return useQuery({
    queryKey: trainerKeys.publicProfile(userId),
    queryFn: () => trainerService.getPublicProfile(userId),
    enabled: userId > 0,
  });
}
export function useGetMyTrainerProfile() {
  return useQuery({
    queryKey: trainerKeys.myProfile(),
    queryFn: trainerService.getMyProfile,
  });
}
export function useUpdateTrainerProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePtProfileRequest) =>
      trainerService.updateMyProfile(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: trainerKeys.all }),
  });
}
export function useUploadTrainerAvatar() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => trainerService.uploadAvatar(file),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.myProfile() }),
  });
}
export function useGetPublicTrainerServices(profileId: number) {
  return useQuery({
    queryKey: trainerKeys.publicServices(profileId),
    queryFn: () => trainerService.getPublicServices(profileId),
    enabled: profileId > 0,
  });
}
export function useGetTrainerServices() {
  return useQuery({
    queryKey: trainerKeys.services(),
    queryFn: () => trainerService.getMyServices(),
  });
}
export function useCreateTrainerService() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: TrainerServiceRequest) =>
      trainerService.createService(payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.services() }),
  });
}
export function useUpdateTrainerService() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: TrainerServiceRequest;
    }) => trainerService.updateService(id, payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.services() }),
  });
}
export function useToggleTrainerService() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      trainerService.toggleService(id, isActive),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.services() }),
  });
}
export function useDeleteTrainerService() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: trainerService.deleteService,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.services() }),
  });
}
export function useGetPublicTrainerAvailability(profileId: number) {
  return useQuery({
    queryKey: trainerKeys.publicAvailability(profileId),
    queryFn: () => trainerService.getPublicAvailability(profileId),
    enabled: profileId > 0,
  });
}
export function useGetTrainerAvailability() {
  return useQuery({
    queryKey: trainerKeys.availability(),
    queryFn: () => trainerService.getMyAvailability(),
  });
}
export function useCreateTrainerAvailability() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: AvailabilityRequest) =>
      trainerService.createAvailability(payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.availability() }),
  });
}
export function useUpdateTrainerAvailability() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: AvailabilityRequest;
    }) => trainerService.updateAvailability(id, payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.availability() }),
  });
}
export function useDeleteTrainerAvailability() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: trainerService.deleteAvailability,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.availability() }),
  });
}
export function useGetPublicTrainerCertificates(profileId: number) {
  return useQuery({
    queryKey: trainerKeys.publicCertificates(profileId),
    queryFn: () => trainerService.getPublicCertificates(profileId),
    enabled: profileId > 0,
  });
}
export function useGetTrainerCertificates() {
  return useQuery({
    queryKey: trainerKeys.certificates(),
    queryFn: () => trainerService.getMyCertificates(),
  });
}
export function useCreateTrainerCertificate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      files,
    }: {
      payload: CertificateRequest;
      files?: File[];
    }) => trainerService.createCertificate(payload, files),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.certificates() }),
  });
}
export function useUpdateTrainerCertificate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      files,
    }: {
      id: number;
      payload: CertificateRequest;
      files?: File[];
    }) => trainerService.updateCertificate(id, payload, files),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.certificates() }),
  });
}
export function useDeleteTrainerCertificate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: trainerService.deleteCertificate,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.certificates() }),
  });
}
export function useGetTrainerPartnerships() {
  return useQuery({
    queryKey: trainerKeys.partnerships(),
    queryFn: () => trainerService.getMyPartnerships(),
  });
}
export function useRequestTrainerPartnership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: PartnershipRequest) =>
      trainerService.requestPartnership(payload),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.partnerships() }),
  });
}
export function useEndTrainerPartnership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: trainerService.endPartnership,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: trainerKeys.partnerships() }),
  });
}
