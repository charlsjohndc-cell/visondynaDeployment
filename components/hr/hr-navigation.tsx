"use client";

import {
  MessageCircle,
  BriefcaseBusiness,
  Blocks,
  FileUser,
} from "lucide-react";
import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { usePathname } from "next/navigation";

const items = [
  { href: "/hr/dashboard", label: "Dashboard", icon: Blocks },
  { href: "/hr/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/hr/applications", label: "Applications", icon: FileUser },
  { href: "/hr/messages", label: "Messages", icon: MessageCircle },
  // { href: "/hr/announcements", label: "Announcements", icon: Bell }, // Adjustment requested by clients
];

export default function HrNavigation() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = item.href === pathname;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              className="text-muted-foreground"
              size="lg"
              tooltip={item.label}
              isActive={isActive}
              asChild
            >
              <Link
                href={item.href}
                className="flex min-w-0 items-center gap-2"
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
