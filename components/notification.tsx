"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Notification = {
  id: string;
  message: string;
  type: "Job" | "Profile" | "Message";
  status: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  isRead: boolean;
  createdAt: string;
  avatar?: string;
};

const POLL_INTERVAL = 8000;

export default function NotificationsPopover({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setLoading(true);

      try {
        const res = await fetch("/api/notifications", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data: { notifications: Notification[] } = await res.json();

        const sorted = (data.notifications ?? []).sort((a, b) => {
          if (a.isRead === b.isRead) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isRead ? 1 : -1;
        });

        setNotifications(sorted.slice(0, 3));
      } catch (err) {
        console.error("POPOVER_NOTIFICATIONS_FETCH_ERROR", err);
        if (!silent) setNotifications([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications({ silent: true });
    }, POLL_INTERVAL);

    const handleFocus = () => {
      fetchNotifications({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      await fetchNotifications();
    }
  };

  const getInitials = (notif: Notification) => {
    const text = notif.company || notif.jobTitle || notif.message || "N";
    const words = text.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "N";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to mark notification as read");

      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );

        return updated.sort((a, b) => {
          if (a.isRead === b.isRead) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isRead ? 1 : -1;
        });
      });
    } catch (err) {
      console.error("MARK_NOTIFICATION_READ_ERROR", err);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>

      <PopoverContent className="w-80 p-0 dark:bg-slate-900" align="end">
        {loading ? (
          <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </p>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No new notifications
          </p>
        ) : (
          <div className="max-h-96 divide-y overflow-y-auto dark:divide-slate-800">
            {notifications.map((notif) => {
              const date = new Date(notif.createdAt);
              const formattedDate = isNaN(date.getTime())
                ? "Unknown date"
                : date.toLocaleString();

              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    notif.isRead ? "bg-slate-100 dark:bg-slate-950/40" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {notif.avatar ? (
                      <AvatarImage src={notif.avatar} />
                    ) : (
                      <AvatarFallback className="bg-lime-600 font-medium text-white">
                        {getInitials(notif)}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1">
                    <p className="line-clamp-2 text-sm text-slate-900 dark:text-slate-100">
                      {notif.message}
                    </p>

                    {(notif.company || notif.jobTitle) && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {notif.jobTitle && notif.jobTitle}
                        {notif.jobTitle && notif.company && " • "}
                        {notif.company && notif.company}
                      </p>
                    )}

                    <span className="mt-1 block text-xs text-slate-400">
                      {formattedDate}
                    </span>
                  </div>

                  {!notif.isRead && (
                    <span className="text-xs text-lime-600 dark:text-lime-400">
                      New
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="w-full border-t p-2 text-center dark:border-slate-800">
          <Link
            href="/notifications"
            className="text-sm text-slate-600 hover:underline dark:text-slate-400"
          >
            View All Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
