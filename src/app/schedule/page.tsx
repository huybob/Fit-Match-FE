import { GymWorkspacePage } from "@/modules/gym-workspace/components/gym-workspace-page";
import { AuthGuard } from "@/modules/auth/auth-guard";

export default function SchedulePage() {
  return <AuthGuard roles={["ROLE_GYM_OPERATOR"]}><GymWorkspacePage activeSection="schedule" /></AuthGuard>;
}
