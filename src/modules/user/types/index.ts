export type UserRole = "ADMIN" | "USER" | "MANAGER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // UI computed properties (previously in ViewModel)
  displayName: string;
  roleLabel: string;
  statusLabel: string;
  statusTone: "green" | "slate";
}
