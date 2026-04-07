"use client";

import * as React from "react";
import {
  BriefcaseBusiness,
  Bell,
  ChevronDown,
  Home,
  MessageCircle,
  Sun,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Notifications from "./notification";
import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";

type ProfileApiResponse = {
  ok: boolean;
  data?: {
    imageUrl?: string | null;
  };
};

type NotificationItem = {
  id: string;
  isRead: boolean;
};

type NotificationsApiResponse = {
  unreadCount?: number;
  notifications?: NotificationItem[];
};

const fallbackAvatar =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const POLL_INTERVAL = 8000;

export default function Navbar() {
  const session = useSession();
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const user = session.data?.user;

  const [profileImage, setProfileImage] = React.useState("");
  const [unreadCount, setUnreadCount] = React.useState(0);

  const displayName =
    user?.name ||
    [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
    "User";

  const avatarSrc = profileImage || user?.image || fallbackAvatar;

  const links = React.useMemo(
    () => [
      { href: "/feed", label: "My Feed", icon: Home },
      { href: "/jobs", label: "Find Jobs", icon: BriefcaseBusiness },
      { href: "/messages", label: "Messages", icon: MessageCircle },
    ],
    []
  );

  const fetchProfile = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/profile", {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!res.ok) return;

      const json: ProfileApiResponse = await res.json();

      if (json?.ok) {
        setProfileImage(json.data?.imageUrl || "");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("NAVBAR_PROFILE_FETCH_ERROR", error);
      }
    }
  }, []);

  const fetchUnreadNotifications = React.useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await fetch("/api/notifications", {
          method: "GET",
          cache: "no-store",
          signal,
        });

        if (!res.ok) return;

        const json: NotificationsApiResponse = await res.json();

        if (typeof json.unreadCount === "number") {
          setUnreadCount(json.unreadCount);
          return;
        }

        const unread =
          json.notifications?.filter((notification) => !notification.isRead)
            .length || 0;

        setUnreadCount(unread);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("NAVBAR_NOTIFICATIONS_FETCH_ERROR", error);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    if (session.status !== "authenticated") return;

    const controller = new AbortController();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const refreshNotifications = () => {
      fetchUnreadNotifications(controller.signal);
    };

    const handleFocus = () => {
      refreshNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshNotifications();
      }
    };

    fetchProfile(controller.signal);
    refreshNotifications();

    intervalId = setInterval(() => {
      refreshNotifications();
    }, POLL_INTERVAL);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();

      if (intervalId) clearInterval(intervalId);

      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session.status, fetchProfile, fetchUnreadNotifications]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center border-b border-slate-200 bg-white/90 p-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-3 items-center px-4">
          <Link
            href="/feed"
            className="text-xl font-bold tracking-wide text-lime-500"
          >
            VISONDYNA
          </Link>

          <nav className="relative hidden items-center justify-center gap-6 md:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex min-w-[80px] flex-col items-center text-xs transition-colors ${
                    active
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400 dark:text-slate-500"
                  } hover:text-slate-700 dark:hover:text-slate-200`}
                >
                  <Icon size={21} className="mb-1" />
                  <span>{label}</span>

                  <span
                    className={`absolute -bottom-[11px] h-[2px] rounded-full bg-lime-500 transition-all duration-300 ${
                      active ? "w-14" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}

            <Notifications
              trigger={
                <div className="relative flex cursor-pointer flex-col items-center text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200">
                  <div className="relative">
                    <Bell
                      size={21}
                      className={unreadCount > 0 ? "text-lime-500" : ""}
                    />

                    {unreadCount > 0 && (
                      <>
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-lime-500 px-1 text-[10px] font-bold text-white shadow">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                        <span className="absolute -right-1 -top-1 h-5 w-5 animate-ping rounded-full bg-lime-400 opacity-75" />
                      </>
                    )}
                  </div>

                  <span className="text-xs">
                    Notifications
                    {unreadCount > 0 ? (
                      <span className="ml-1 text-lime-500">• New</span>
                    ) : null}
                  </span>
                </div>
              }
            />
          </nav>

          <div className="inline-flex items-center justify-self-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1 outline-none transition hover:bg-slate-100 dark:hover:bg-slate-800">
                <Avatar className="h-9 w-9 ring-1 ring-slate-200 dark:ring-slate-700">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback>{displayName.at(0)}</AvatarFallback>
                </Avatar>

                <div className="hidden flex-col items-start md:flex">
                  <span className="text-sm font-medium dark:text-white">
                    {displayName}
                  </span>
                  <span className="text-xs font-medium text-lime-500">
                    Online
                  </span>
                </div>

                <ChevronDown size={16} className="ml-1 text-gray-500" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl dark:bg-slate-900"
              >
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">My Profile</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer">
                  Help
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer text-red-500"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-4 border-t border-slate-200 bg-white/95 px-6 py-2 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 text-xs transition-colors ${
                active ? "text-lime-500" : "text-slate-500"
              } hover:text-lime-500`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {active && (
                <span className="absolute -top-2 h-[2px] w-12 rounded-full bg-lime-500" />
              )}
            </Link>
          );
        })}

        <Notifications
          trigger={
            <div className="relative flex flex-col items-center gap-1 text-xs text-slate-500 transition-colors hover:text-lime-500">
              <div className="relative">
                <Bell size={20} className={unreadCount > 0 ? "text-lime-500" : ""} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-lime-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span>Alerts</span>
            </div>
          }
        />
      </nav>
    </>
  );
}
