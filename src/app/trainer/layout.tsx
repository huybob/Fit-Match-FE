import { ReactNode } from "react";
import { TrainerLayout } from "@/modules/trainer/components/trainer-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <TrainerLayout>{children}</TrainerLayout>;
}
