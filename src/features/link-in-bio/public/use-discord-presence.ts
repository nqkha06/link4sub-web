"use client";

import { useEffect, useState } from "react";

import { parseLanyardPresence, type DiscordPresence } from "./bio-public-model";

const LANYARD_ENDPOINT = "https://api.lanyard.rest/v1/users/";
const REFRESH_MS = 30_000;

/**
 * Trạng thái Discord qua Lanyard — chỉ có dữ liệu khi chủ trang đã tham gia
 * server Lanyard; không có thì trả `null` và giao diện hiện thẻ tĩnh.
 */
export function useDiscordPresence(userId?: string | null): DiscordPresence | null {
  const [presence, setPresence] = useState<DiscordPresence | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(`${LANYARD_ENDPOINT}${encodeURIComponent(userId)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = (await response.json()) as { success?: boolean; data?: unknown };
        const next = body.success ? parseLanyardPresence(body.data) : null;
        if (active && next) setPresence(next);
      } catch {
        // Lỗi mạng: giữ trạng thái cũ.
      }
    };

    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [userId]);

  return presence?.userId === userId ? presence : null;
}
