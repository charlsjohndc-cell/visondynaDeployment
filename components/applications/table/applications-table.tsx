"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  ArrowDownUp,
  RefreshCcw,
  FunnelIcon,
  CircleMinus,
  CircleX,
  CircleCheck,
  BadgeCheck,
  CalendarDays,
  Search,
  LucideIcon,
  Clock,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

import ApplicationDetailsDialog from "../modals/application-details-dialog";
import PaginationControls from "@/components/jobs/pagination/pagination-controls";
import SearchInput from "@/components/jobs/controls/search-input";
import type {
  ApplicationRow,
  ApplicationsMetaCursor,
  ApplicationsMetaOffset,
  SortDir,
} from "@/lib/types";
import { ApplicationStatus } from "@prisma/client";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortKey = "applicant" | "email" | "jobTitle" | "status" | "submittedAt";

type Props = {
  initialRows: ApplicationRow[];
  initialMeta: ApplicationsMetaCursor | ApplicationsMetaOffset;
  initialLimit?: number;
};

type ApiResponse =
  | { data: ApplicationRow[]; meta: ApplicationsMetaCursor }
  | { data: ApplicationRow[]; meta: ApplicationsMetaOffset };

type StatusWithAll = ApplicationStatus | "ALL";

const StatusLabel: Record<StatusWithAll, string> = {
  ALL: "All Statuses",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  INTERVIEWED: "Interviewed",
  OFFERED: "Offered",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const STATUS_ICON: Record<ApplicationStatus, LucideIcon> = {
  SUBMITTED: Clock,
  UNDER_REVIEW: Search,
  SHORTLISTED: CircleMinus,
  INTERVIEWED: CalendarDays,
  OFFERED: BadgeCheck,
  HIRED: CircleCheck,
  REJECTED: CircleX,
  WITHDRAWN: CircleMinus,
};

const iconClassByStatus: Record<ApplicationStatus, string> = {
  SUBMITTED: "size-4 stroke-slate-500",
  UNDER_REVIEW: "size-4 stroke-slate-500",
  SHORTLISTED: "size-4 fill-slate-500 stroke-white dark:stroke-slate-950",
  INTERVIEWED: "size-4 stroke-slate-500",
  OFFERED: "size-4 fill-cyan-500 stroke-white dark:stroke-slate-950",
  HIRED: "size-4 fill-lime-500 stroke-white dark:stroke-slate-950",
  REJECTED: "size-4 fill-red-500 stroke-white dark:stroke-slate-950",
  WITHDRAWN: "size-4 stroke-slate-400",
};

const ENDPOINT = "/api/applications";

export function renderStatusPill(status: ApplicationStatus) {
  const Icon = STATUS_ICON[status];
  const iconClass = iconClassByStatus[status];
  const label = StatusLabel[status];

  return (
    <Badge
      variant="outline"
      className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs whitespace-nowrap"
    >
      <Icon className={iconClass} />
      <span>{label}</span>
    </Badge>
  );
}

export default function ApplicationsTable({
  initialRows,
  initialMeta,
  initialLimit = 10,
}: Props) {
  const [rows, setRows] = useState<ApplicationRow[]>(initialRows);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusWithAll>("ALL");

  const [sortBy, setSortBy] = useState<SortKey>(initialMeta.sortBy);
  const [sortDir, setSortDir] = useState<SortDir>(initialMeta.sortDir);

  const [limit, setLimit] = useState(initialLimit);
  const [pagingMode, setPagingMode] = useState<"cursor" | "offset">(
    initialMeta.paging.mode,
  );

  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialMeta.paging.mode === "cursor" ? initialMeta.paging.nextCursor : null,
  );
  const backStackRef = useRef<(string | null)[]>([]);

  const [page, setPage] = useState(
    initialMeta.paging.mode === "offset" ? initialMeta.paging.page : 1,
  );
  const [totalPages, setTotalPages] = useState(
    initialMeta.paging.mode === "offset" ? initialMeta.paging.totalPages : 1,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      resetToFirstPage();
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  function resetToFirstPage() {
    if (sortBy === "submittedAt") {
      setCursor(null);
      backStackRef.current = [];
    } else {
      setPage(1);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir(key === "submittedAt" ? "desc" : "asc");

      if (key === "submittedAt") {
        setCursor(null);
        backStackRef.current = [];
        setPagingMode("cursor");
      } else {
        setPage(1);
        setPagingMode("offset");
      }
      return;
    }

    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    resetToFirstPage();
  }

  function renderSortIcon(column: SortKey) {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    }

    return sortDir === "asc" ? (
      <ArrowUpDown className="h-3.5 w-3.5" />
    ) : (
      <ArrowDownUp className="h-3.5 w-3.5" />
    );
  }

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);

    if (q) params.set("q", q);
    if (status !== "ALL") params.set("status", status);

    if (sortBy === "submittedAt") {
      if (cursor) params.set("cursor", cursor);
    } else {
      params.set("page", String(page));
    }

    return params.toString();
  }, [limit, sortBy, sortDir, q, status, cursor, page]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setIsError(null);

      try {
        const res = await fetch(`${ENDPOINT}?${queryString}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(await res.text());

        const json = (await res.json()) as ApiResponse;
        if (cancelled) return;

        setRows(json.data ?? []);
        const mode = json.meta.paging.mode;
        setPagingMode(mode);

        if (mode === "cursor") {
          setNextCursor(json.meta.paging.nextCursor);
        } else {
          setTotalPages(json.meta.paging.totalPages);
        }
      } catch (e) {
        if (cancelled) return;

        setIsError(
          e instanceof Error ? e.message : "Failed to load applications.",
        );
        setRows([]);
        setNextCursor(null);
        setTotalPages(1);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  function handlePrev() {
    if (pagingMode === "cursor") {
      const prev = backStackRef.current.pop() ?? null;
      setCursor(prev);
    } else {
      setPage((p) => Math.max(1, p - 1));
    }
  }

  function handleNext() {
    if (pagingMode === "cursor") {
      if (!nextCursor) return;
      backStackRef.current.push(cursor);
      setCursor(nextCursor);
    } else {
      if (page >= totalPages) return;
      setPage((p) => Math.min(totalPages, p + 1));
    }
  }

  function handleLimitChange(n: number) {
    setLimit(n);
    resetToFirstPage();
  }

  async function refresh() {
    try {
      setIsLoading(true);
      setIsError(null);

      const res = await fetch(`${ENDPOINT}?${queryString}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Refresh failed.");

      const json = (await res.json()) as ApiResponse;
      setRows(json.data ?? []);

      const mode = json.meta.paging.mode;
      setPagingMode(mode);

      if (mode === "cursor") {
        setNextCursor(json.meta.paging.nextCursor);
      } else {
        setTotalPages(json.meta.paging.totalPages);
      }
    } catch (e) {
      setIsError(e instanceof Error ? e.message : "Refresh failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function openDetails(id: string) {
    setSelectedId(id);
    setOpenDialog(true);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={qInput}
              onChange={setQInput}
              resultsHint={rows.length}
              loading={isLoading}
              placeholder="Search applicant, email, or job title..."
            />
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between sm:w-[220px]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FunnelIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate text-muted-foreground">
                      {status === "ALL" ? "All Statuses" : StatusLabel[status]}
                    </span>
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuGroup className="space-y-1">
                  {(Object.keys(StatusLabel) as StatusWithAll[]).map((key) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => {
                        setStatus(key);
                        resetToFirstPage();
                      }}
                    >
                      {StatusLabel[key]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={refresh}
              disabled={isLoading}
              className="w-full bg-lime-500 text-white hover:bg-lime-600 sm:w-auto"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden rounded-xl border shadow-sm">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader className="bg-muted/40">
                <TableRow className="text-xs uppercase tracking-wide">
                  <TableHead className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("applicant")}
                      className="inline-flex items-center gap-1 font-semibold uppercase hover:text-foreground"
                    >
                      Applicant Name
                      {renderSortIcon("applicant")}
                    </button>
                  </TableHead>

                  <TableHead className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("email")}
                      className="inline-flex items-center gap-1 font-semibold uppercase hover:text-foreground"
                    >
                      Email
                      {renderSortIcon("email")}
                    </button>
                  </TableHead>

                  <TableHead className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("jobTitle")}
                      className="inline-flex items-center gap-1 font-semibold uppercase hover:text-foreground"
                    >
                      Job
                      {renderSortIcon("jobTitle")}
                    </button>
                  </TableHead>

                  <TableHead className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("status")}
                      className="inline-flex items-center gap-1 font-semibold uppercase hover:text-foreground"
                    >
                      Status
                      {renderSortIcon("status")}
                    </button>
                  </TableHead>

                  <TableHead className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("submittedAt")}
                      className="inline-flex items-center gap-1 font-semibold uppercase hover:text-foreground"
                    >
                      Applied On
                      {renderSortIcon("submittedAt")}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && rows.length === 0 ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j} className="px-4 py-4">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-4 py-6">
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                        <p className="font-medium text-destructive">
                          Failed to load applications
                        </p>
                        <p className="mt-1 text-muted-foreground">{isError}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((a) => (
                    <TableRow
                      key={a.id}
                      onClick={() => openDetails(a.id)}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="max-w-[220px] px-4 py-3 font-medium">
                        <div className="truncate">{a.applicant.name}</div>
                      </TableCell>

                      <TableCell className="max-w-[220px] px-4 py-3 text-muted-foreground">
                        <div className="truncate">{a.applicant.email}</div>
                      </TableCell>

                      <TableCell className="max-w-[280px] px-4 py-3 text-muted-foreground">
                        <div className="truncate">
                          {a.job?.title
                            ? `${a.job.title} — ${a.job.company}`
                            : "—"}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        {renderStatusPill(a.status)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {format(new Date(a.submittedAt), "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <PaginationControls
          pagingMode={pagingMode}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          canPrev={
            pagingMode === "cursor" ? backStackRef.current.length > 0 : page > 1
          }
          canNext={
            pagingMode === "cursor" ? Boolean(nextCursor) : page < totalPages
          }
          limit={limit}
          onPrev={handlePrev}
          onNext={handleNext}
          onLimitChange={handleLimitChange}
          cursorStackLen={backStackRef.current.length}
        />
      </div>

      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) setSelectedId(null);
        }}
      >
        {selectedId && (
          <ApplicationDetailsDialog
            applicationId={selectedId}
            onClose={() => {
              setSelectedId(null);
              setOpenDialog(false);
            }}
            onUpdated={refresh}
          />
        )}
      </Dialog>
    </>
  );
}