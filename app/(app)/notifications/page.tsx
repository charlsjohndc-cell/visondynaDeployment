"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type FilterKey = "all" | "unread" | "read" | "jobs";

function getInitials(n: Notification) {
  if (!n.message) return "N";
  return n.message
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupNotificationsByDate(items: Notification[]) {
  const groups: Record<string, Notification[]> = {};

  for (const item of items) {
    const date = new Date(item.createdAt);
    const label = date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  return groups;
}

function NotificationSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalData, setModalData] = useState<Notification | null>(null);

  const fetchNotifications = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data: { notifications: Notification[] } = await res.json();

      const sorted = (data.notifications ?? []).sort((a, b) => {
        if (a.isRead !== b.isRead) return Number(a.isRead) - Number(b.isRead);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setNotifications(sorted);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const toggleRead = async (id: string, read: boolean) => {
    const previous = notifications;

    setNotifications((prev) =>
      [...prev.map((n) => (n.id === id ? { ...n, isRead: read } : n))].sort((a, b) => {
        if (a.isRead !== b.isRead) return Number(a.isRead) - Number(b.isRead);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    );

    try {
      await fetch(`/api/notifications/${id}/${read ? "read" : "unread"}`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error(err);
      setNotifications(previous);
    }
  };

  const markAllAsRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.error(err);
      setNotifications(previous);
    }
  };

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      read: notifications.filter((n) => n.isRead).length,
      jobs: notifications.filter((n) => n.type === "Job").length,
    };
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "unread") return !n.isRead;
      if (filter === "read") return n.isRead;
      if (filter === "jobs") return n.type === "Job";
      return true;
    });
  }, [notifications, filter]);

  const grouped = useMemo(() => groupNotificationsByDate(filtered), [filtered]);

  const filters = [
    { key: "all" as FilterKey, label: "All", count: counts.all },
    { key: "unread" as FilterKey, label: "Unread", count: counts.unread },
    { key: "read" as FilterKey, label: "Read", count: counts.read },
    { key: "jobs" as FilterKey, label: "Jobs", count: counts.jobs },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-xs font-medium text-lime-700 dark:border-lime-900 dark:bg-lime-950/40 dark:text-lime-300">
                <Bell className="h-3.5 w-3.5" />
                Notification Center
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Stay updated with job activity, profile updates, and important alerts.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => fetchNotifications(true)}
                className="rounded-xl"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                onClick={markAllAsRead}
                className="rounded-xl bg-lime-600 text-white hover:bg-lime-700 dark:bg-lime-500 dark:hover:bg-lime-600"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Notifications</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{counts.all}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Unread</p>
            <p className="mt-2 text-2xl font-bold text-lime-600 dark:text-lime-400">
              {counts.unread}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Job Notifications</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{counts.jobs}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Main */}
          <div className="xl:col-span-8">
            <div className="rounded-3xl border border-border bg-card shadow-sm">
              {/* Filter */}
              <div className="border-b border-border p-4">
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => {
                    const active = filter === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setFilter(item.key)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? "border-lime-600 bg-lime-600 text-white dark:border-lime-500 dark:bg-lime-500"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List */}
              <div className="p-4 sm:p-5">
                {loading ? (
                  <div className="space-y-4">
                    <NotificationSkeleton />
                    <NotificationSkeleton />
                    <NotificationSkeleton />
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(grouped).map(([dateLabel, items]) => (
                      <div key={dateLabel}>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                          {dateLabel}
                        </p>

                        <div className="space-y-3">
                          {items.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => setModalData(notif)}
                              className={`group cursor-pointer rounded-2xl border p-4 transition hover:border-lime-300 hover:shadow-md dark:hover:border-lime-800 ${
                                notif.isRead
                                  ? "border-border bg-background"
                                  : "border-lime-200 bg-lime-50/40 dark:border-lime-900 dark:bg-lime-950/20"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="relative">
                                  <Avatar className="h-11 w-11 ring-1 ring-border">
                                    {notif.avatar ? (
                                      <AvatarImage src={notif.avatar} alt={notif.message} />
                                    ) : (
                                      <AvatarFallback className="bg-lime-600 font-semibold text-white">
                                        {getInitials(notif)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>

                                  {!notif.isRead && (
                                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-lime-500" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-border text-xs"
                                    >
                                      {notif.type}
                                    </Badge>

                                    <span
                                      className={`text-xs font-medium ${
                                        notif.isRead
                                          ? "text-muted-foreground"
                                          : "text-lime-600 dark:text-lime-400"
                                      }`}
                                    >
                                      {notif.isRead ? "Read" : "New"}
                                    </span>
                                  </div>

                                  <p className="text-sm font-semibold leading-6 text-foreground">
                                    {notif.message}
                                  </p>

                                  {(notif.jobTitle || notif.company || notif.location) && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {notif.jobTitle && `${notif.jobTitle}`}
                                      {notif.jobTitle && notif.company && " • "}
                                      {notif.company && `${notif.company}`}
                                      {(notif.jobTitle || notif.company) && notif.location && " • "}
                                      {notif.location && `${notif.location}`}
                                    </p>
                                  )}

                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(notif.createdAt)}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRead(notif.id, !notif.isRead);
                                      }}
                                      className="text-xs font-medium text-lime-600 transition hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300"
                                    >
                                      {notif.isRead ? "Mark unread" : "Mark read"}
                                    </button>
                                  </div>
                                </div>

                                <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
                    <div className="mb-4 rounded-full bg-muted p-4">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      No notifications found
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      There’s nothing here yet for this filter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="xl:col-span-4">
            <div className="space-y-6 xl:sticky xl:top-6">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Overview</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep track of your latest activity.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Unread progress</span>
                      <span className="font-medium text-foreground">{counts.unread}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-lime-500 transition-all"
                        style={{
                          width:
                            counts.all > 0 ? `${(counts.unread / counts.all) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Read</p>
                      <p className="mt-1 text-lg font-bold">{counts.read}</p>
                    </div>
                    <div className="rounded-2xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">Unread</p>
                      <p className="mt-1 text-lg font-bold text-lime-600 dark:text-lime-400">
                        {counts.unread}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Suggested for you</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore more opportunities and improve your visibility.
                </p>

                <div className="mt-4 space-y-3">
                  <Link href="/jobs" className="block">
                    <div className="flex items-center justify-between rounded-2xl border border-border p-4 transition hover:border-lime-300 hover:bg-muted/40 dark:hover:border-lime-800">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-lime-100 p-2.5 dark:bg-lime-950/40">
                          <BriefcaseBusiness className="h-4 w-4 text-lime-700 dark:text-lime-300" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Explore Jobs</p>
                          <p className="text-xs text-muted-foreground">
                            Find new opportunities
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal */}
      <Dialog
        open={!!modalData}
        onOpenChange={(open) => {
          if (!open) setModalData(null);
        }}
      >
        <DialogContent className="rounded-3xl border border-border bg-background p-0 shadow-xl sm:max-w-2xl">
          {modalData && (
            <>
              <div className="border-b border-border px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-left text-xl font-bold">
                    Notification Details
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 ring-1 ring-border">
                    {modalData.avatar ? (
                      <AvatarImage src={modalData.avatar} alt={modalData.message} />
                    ) : (
                      <AvatarFallback className="bg-lime-600 font-semibold text-white">
                        {getInitials(modalData)}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full">
                        {modalData.type}
                      </Badge>
                      <Badge
                        className={`rounded-full ${
                          modalData.isRead
                            ? "bg-muted text-muted-foreground"
                            : "bg-lime-600 text-white dark:bg-lime-500"
                        }`}
                      >
                        {modalData.isRead ? "Read" : "Unread"}
                      </Badge>
                    </div>

                    <p className="text-lg font-semibold text-foreground">
                      {modalData.message}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatTime(modalData.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="mt-1 font-medium text-foreground">{modalData.type}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 font-medium text-foreground">{modalData.status}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="mt-1 font-medium text-foreground">
                      {modalData.company || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Job Title</p>
                    <p className="mt-1 font-medium text-foreground">
                      {modalData.jobTitle || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="mt-1 font-medium text-foreground">
                      {modalData.location || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toggleRead(modalData.id, !modalData.isRead)}
                  >
                    {modalData.isRead ? "Mark as unread" : "Mark as read"}
                  </Button>

                  <Button
                    className="rounded-xl bg-lime-600 text-white hover:bg-lime-700 dark:bg-lime-500 dark:hover:bg-lime-600"
                    onClick={() => setModalData(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
