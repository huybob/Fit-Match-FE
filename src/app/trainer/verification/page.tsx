"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// PT self-registration/verification was removed — PTs are now created & verified by their Gym.
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/trainer");
  }, [router]);
  return null;
}
