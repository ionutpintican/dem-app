"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-fetch server data când utilizatorul revine pe tab — statusul cazului
// se poate schimba din alt tab/dispozitiv (trimis, redeschis etc.)
export default function RevalidateOnFocus() {
  const router = useRouter();

  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  return null;
}
