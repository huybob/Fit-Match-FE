"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { userQueryKeys } from "../query-keys";
import { CreateUserSchema, UpdateUserSchema } from "../schemas/user.schema";

export function useUsers() {
  return useQuery({
    queryKey: userQueryKeys.all,
    queryFn: () => userService.getUsers(),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserSchema) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserSchema) => userService.updateUser(data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(updatedUser.id) });
    },
  });
}
