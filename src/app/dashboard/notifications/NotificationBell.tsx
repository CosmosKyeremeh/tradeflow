"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check } from "lucide-react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
  type Notification,
} from "./actions";

const POLL_INTERVAL_MS = 45_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const refreshCount = () => {
      unreadNotificationCount().then((n) => {
        if (!cancelled) setUnread(n);
      });
    };
    refreshCount();
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    listNotifications().then(setItems);

    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleMarkOne(id: string) {
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)) ?? prev);
    setUnread((n) => Math.max(0, n - 1));
    await markNotificationRead(id);
  }

  async function handleMarkAll() {
    setItems((prev) => prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })) ?? prev);
    setUnread(0);
    await markAllNotificationsRead();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-foreground transition-colors hover:bg-surface-muted active:scale-90"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <motion.span
            key={unread}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="glass-surface elevation-lg absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-primary">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items === null ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No notifications yet
                </p>
              ) : (
                <ul>
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => !n.readAt && handleMarkOne(n.id)}
                        className="flex w-full items-start gap-2 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-muted"
                      >
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-accent"}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-xs ${n.readAt ? "text-muted-foreground" : "text-foreground"}`}
                          >
                            {n.message}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
