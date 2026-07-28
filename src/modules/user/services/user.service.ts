import { axiosClient } from "@/core/http/axios-client";
import { ApiResponse } from "@/shared/types/api-response.type";
import { User } from "../types";
import { CreateUserSchema, UpdateUserSchema } from "../schemas/user.schema";

type UserApiModel = Omit<
  User,
  "displayName" | "roleLabel" | "statusLabel" | "statusTone"
>;

// Helper to map API response to our unified User type
function mapToUser(data: UserApiModel): User {
  return {
    ...data,
    displayName: data.name,
    roleLabel: data.role,
    statusLabel: data.isActive ? "Active" : "Inactive",
    statusTone: data.isActive ? "green" : "slate",
  };
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await axiosClient.get<ApiResponse<UserApiModel[]>>("/users");
    return response.data.data.map(mapToUser);
  },

  async getUserById(id: string): Promise<User> {
    const response = await axiosClient.get<ApiResponse<UserApiModel>>(`/users/${id}`);
    return mapToUser(response.data.data);
  },

  async createUser(payload: CreateUserSchema): Promise<User> {
    const response = await axiosClient.post<ApiResponse<UserApiModel>>(
      "/users",
      payload,
    );
    return mapToUser(response.data.data);
  },

  async updateUser(payload: UpdateUserSchema): Promise<User> {
    const response = await axiosClient.put<ApiResponse<UserApiModel>>(
      `/users/${payload.id}`,
      payload
    );
    return mapToUser(response.data.data);
  },

  async deleteUser(id: string): Promise<void> {
    await axiosClient.delete<ApiResponse<void>>(`/users/${id}`);
  },
};
