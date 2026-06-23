import { GymWorkspacePage } from "@/modules/gym-workspace/components/gym-workspace-page";
import { AuthGuard } from "@/modules/auth/auth-guard";

export default function MembersPage() {
  return <AuthGuard roles={["ROLE_GYM_OPERATOR"]}><GymWorkspacePage activeSection="members" /></AuthGuard>;
}
