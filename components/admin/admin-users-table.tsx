"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SearchInput from "@/components/jobs/controls/search-input";
import PaginationControls from "@/components/jobs/pagination/pagination-controls";
import { Plus, MoreHorizontal } from "lucide-react";
import CreateAdminUserContent from "./users/create-admin-user-content";
import { Sheet, SheetTrigger } from "../ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { toTitleCase } from "@/lib/utils";

type UserRole = "ADMIN" | "HR" | "APPLICANT";

type RawAdminUser = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
  isSuspended: boolean;
  emailVerified: string | null;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isSuspended: boolean;
  emailVerified: string | null;
};

type PagingMeta = {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
};

type UsersResponse = {
  data: RawAdminUser[];
  meta: PagingMeta;
};

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED";
type RoleFilter = "ALL" | "ADMIN" | "HR" | "APPLICANT";

const ENDPOINT = "/api/admin/users";

export default function AdminUsersTable() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (q) params.set("q", q);
    if (status !== "ALL") params.set("status", status);
    if (role !== "ALL") params.set("role", role);
    return params.toString();
  }, [page, limit, q, status, role]);

  async function refreshUsers() {
    try {
      setIsLoading(true);
      const res = await fetch(`${ENDPOINT}?${queryString}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const json = (await res.json()) as UsersResponse;

      const mapped = json.data.map((u) => ({
        id: u.id,
        name: `${u.firstname} ${u.lastname}`,
        email: u.email,
        role: u.role,
        isSuspended: u.isSuspended,
        emailVerified: u.emailVerified,
      }));

      setUsers(mapped);
      setTotalPages(json.meta.totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users.");
      setUsers([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshUsers();
  }, [queryString]);

  function statusBadge(isSuspended: boolean) {
    const label = isSuspended ? "Banned" : "Active";
    const classes = isSuspended
      ? "border-red-500/60 text-red-300"
      : "border-emerald-500/60 text-emerald-300";

    return (
      <Badge
        variant="outline"
        className={`px-2 py-0.5 text-xs ${classes} font-normal`}
      >
        {label}
      </Badge>
    );
  }

  function emailVerifiedBadge(emailVerified: string | null) {
    const isVerified = Boolean(emailVerified);
    const label = isVerified ? "Verified" : "Not Verified";
    const classes = isVerified
      ? "border-sky-500/60 text-sky-300"
      : "border-slate-500/60 text-slate-300";

    return (
      <Badge
        variant="outline"
        className={`px-2 py-0.5 text-xs ${classes} font-normal`}
      >
        {label}
      </Badge>
    );
  }

  function roleBadge(role: UserRole) {
    const classes =
      role === "ADMIN"
        ? "border-purple-500/60 text-purple-300"
        : role === "HR"
          ? "border-amber-500/60 text-amber-300"
          : "border-cyan-500/60 text-cyan-300";

    return (
      <Badge
        variant="outline"
        className={`px-2 py-0.5 text-xs ${classes} font-normal`}
      >
        {toTitleCase(role)}
      </Badge>
    );
  }

  async function handleSuspend(id: string) {
    if (id === currentUserId) {
      toast.error("You cannot suspend your own account.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: true }),
      });

      if (!res.ok) throw new Error("Failed to suspend user");
      toast.success("User suspended");
      refreshUsers();
    } catch (err) {
      console.log(err);
      toast.error("Error suspending user");
    }
  }

  async function handleActivate(id: string) {
    if (id === currentUserId) {
      toast.error("You cannot modify your own suspension status here.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: false }),
      });

      if (!res.ok) throw new Error("Failed to activate user");
      toast.success("User activated");
      refreshUsers();
    } catch (err) {
      console.log(err);
      toast.error("Error activating user");
    }
  }

  async function handleDelete(id: string) {
    if (id === currentUserId) {
      toast.error(
        "You cannot delete the account you are currently signed in with.",
      );
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      refreshUsers();
    } catch (err) {
      console.log(err);
      toast.error("Error deleting user");
    }
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <div className="space-y-6 animate-in fade-in">
        <h1 className="text-lg font-semibold">User Management</h1>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <SearchInput
            value={qInput}
            onChange={setQInput}
            resultsHint={users.length}
            loading={isLoading}
            placeholder="Search users…"
          />

          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="single"
              value={status}
              onValueChange={(value: string) => {
                if (!value) return;
                setStatus(value as StatusFilter);
                setPage(1);
              }}
              className="rounded-md border border-border/60 text-xs"
            >
              <ToggleGroupItem
                value="ALL"
                className="px-3 py-1 data-[state=on]:bg-muted data-[state=off]:text-muted-foreground data-[state=on]:text-foreground"
              >
                All
              </ToggleGroupItem>
              <ToggleGroupItem
                value="ACTIVE"
                className="px-3 py-1 data-[state=on]:bg-muted data-[state=off]:text-muted-foreground data-[state=on]:text-foreground"
              >
                Active
              </ToggleGroupItem>
              <ToggleGroupItem
                value="SUSPENDED"
                className="rounded-r-md px-3 py-1 data-[state=on]:bg-muted data-[state=off]:text-muted-foreground data-[state=on]:text-foreground"
              >
                Banned
              </ToggleGroupItem>
            </ToggleGroup>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {role === "ALL" ? "All Roles" : toTitleCase(role)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setRole("ALL");
                    setPage(1);
                  }}
                >
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setRole("ADMIN");
                    setPage(1);
                  }}
                >
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setRole("HR");
                    setPage(1);
                  }}
                >
                  HR
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setRole("APPLICANT");
                    setPage(1);
                  }}
                >
                  Applicant
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <SheetTrigger asChild>
              <Button className="flex items-center bg-lime-500 text-white">
                <Plus className="size-4" />
                <span>Add User</span>
              </Button>
            </SheetTrigger>
          </div>
        </div>

        <Card className="overflow-hidden rounded-md">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase">
                  <TableHead className="px-4 py-2">Name</TableHead>
                  <TableHead className="px-4 py-2">Email</TableHead>
                  <TableHead className="px-4 py-2">Email Verified</TableHead>
                  <TableHead className="px-4 py-2">Role</TableHead>
                  <TableHead className="px-4 py-2">Status</TableHead>
                  <TableHead className="px-4 py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-4 w-56" />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const isCurrent = user.id === currentUserId;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="px-4 py-2 align-middle font-medium dark:text-slate-50">
                          <div className="flex items-center gap-2">
                            <span>{user.name}</span>
                            {isCurrent && (
                              <Badge
                                variant="outline"
                                className="border-sky-500/60 bg-sky-500/10 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-sky-300"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                          {user.email}
                        </TableCell>

                        <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                          {emailVerifiedBadge(user.emailVerified)}
                        </TableCell>

                        <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                          {roleBadge(user.role)}
                        </TableCell>

                        <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                          {statusBadge(user.isSuspended)}
                        </TableCell>

                        <TableCell className="px-4 py-2 align-middle dark:text-slate-300">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>

                              {isCurrent ? (
                                <DropdownMenuItem
                                  disabled
                                  className="text-xs text-muted-foreground"
                                >
                                  This account is currently signed in.
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  {!user.isSuspended ? (
                                    <DropdownMenuItem
                                      onClick={() => handleSuspend(user.id)}
                                      className="text-red-400"
                                    >
                                      Suspend
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleActivate(user.id)}
                                      className="text-emerald-400"
                                    >
                                      Activate
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => handleDelete(user.id)}
                                    className="text-red-500"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <PaginationControls
          pagingMode="offset"
          page={page}
          totalPages={totalPages}
          limit={limit}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
          isLoading={isLoading}
          canPrev={page > 1}
          canNext={page < totalPages}
          cursorStackLen={0}
        />
      </div>

      <CreateAdminUserContent
        onCreated={() => {
          refreshUsers();
          setSheetOpen(false);
        }}
      />
    </Sheet>
  );
}