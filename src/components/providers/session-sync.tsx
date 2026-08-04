"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Me } from "@/lib/types";
import { useSession } from "@/store/session";

/** Hydrates the client session store from /api/me (server is authoritative). */
export function SessionSync() {
  const setMe = useSession((s) => s.setMe);

  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me> => {
      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) setMe(data);
  }, [data, setMe]);

  return null;
}
