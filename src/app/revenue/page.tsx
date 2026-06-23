import { GymWorkspacePage } from "@/modules/gym-workspace/components/gym-workspace-page";
import { AuthGuard } from "@/modules/auth/auth-guard";

export default function RevenuePage() {
  return <AuthGuard roles={["ROLE_GYM_OPERATOR"]}><GymWorkspacePage activeSection="revenue" /></AuthGuard>;
}
