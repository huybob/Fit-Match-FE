"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  measurementService,
  type BodyMeasurementRequest,
} from "@/services/measurement.service";
import { measurementKeys } from "../query-keys";

export function useMyMeasurements() {
  return useQuery({
    queryKey: measurementKeys.mine(),
    queryFn: () => measurementService.getMine(),
  });
}

export function useCustomerMeasurements(customerId: number) {
  return useQuery({
    queryKey: measurementKeys.byCustomer(customerId),
    queryFn: () => measurementService.getByCustomer(customerId),
    enabled: customerId > 0,
  });
}

export function useCreateMeasurement() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (payload: BodyMeasurementRequest) => measurementService.create(payload),
    onSuccess: () => c.invalidateQueries({ queryKey: measurementKeys.all }),
  });
}
