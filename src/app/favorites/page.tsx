"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Favorites moved into the profile section sidebar.
export default function FavoritesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile/favorites");
  }, [router]);
  return null;
}
