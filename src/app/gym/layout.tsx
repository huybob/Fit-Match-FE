import { ReactNode } from "react";
import { GymLayout } from "@/modules/gym/components/gym-layout";
export default function Layout({ children }: { children: ReactNode }) {
  return <GymLayout>{children}</GymLayout>;
}
