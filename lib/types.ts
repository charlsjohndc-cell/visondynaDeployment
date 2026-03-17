import type { JobStatus } from "@prisma/client";

export type ServerError = {
  ok: boolean;
  error: { code: string; message: string };
  message: string;
};

export type Role = "ADMIN" | "APPLICANT" | "HR";

export type ConversationSummary = {
  id: string;
  applicantProfileId?: string | null;
  subject?: string | null;
  lastMessageAt?: string | null;
  applicant?: {
    id: string;
    user?: { firstname?: string; lastname?: string; email?: string } | null;
  } | null;
  _count?: { messages?: number } | null;
};

export type ApiMessage = {
  id: string;
  conversationId: string;
  senderRole: "HR" | "APPLICANT";
  senderUserId?: string | null;
  content: string;
  readAt?: string | null;
  createdAt: string;
};

export type UiMessage = {
  id: string; // string id (keeps original server id)
  sender: "HR" | "APPLICANT";
  content: string;
  time: string; // human friendly time
  read?: boolean;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  manpower: number;
  salary: number;
  company: string;
  location: string;
  status: JobStatus;
  createdAt: string; // ISO string (serialize Dates in the server)
  categoryId: string;
  category?: { id: string; name: string } | null;
  _count?: { applications?: number };
  applicantsCount?: number;
};

export type JobsMetaCursor = {
  limit: number;
  nextCursor: string | null;
  sortBy: "title" | "salary" | "manpower" | "createdAt";
  sortDir: "asc" | "desc";
  paging: { mode: "cursor"; nextCursor: string | null };
};

export type JobsMetaOffset = {
  limit: number;
  nextCursor: null;
  sortBy: "title" | "salary" | "manpower" | "createdAt";
  sortDir: "asc" | "desc";
  paging: {
    mode: "offset";
    page: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export type Category = { id: string; name: string };

export type SortKey =
  | "title"
  | "salary"
  | "manpower"
  | "applications"
  | "createdAt";

export type SortDir = "asc" | "desc";

// lib/types.ts (append these)
export type ApplicationRow = {
  id: string;
  status:
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "SHORTLISTED"
    | "INTERVIEWED"
    | "OFFERED"
    | "HIRED"
    | "REJECTED"
    | "WITHDRAWN";
  submittedAt: string;
  job: { id: string; title: string; company: string; location: string } | null;
  applicant: { id: string; name: string; email: string };
};

export type ApplicationsMetaCursor = {
  limit: number;
  sortBy: "submittedAt";
  sortDir: "asc" | "desc";
  paging: { mode: "cursor"; nextCursor: string | null };
};

export type ApplicationsMetaOffset = {
  limit: number;
  sortBy: "applicant" | "email" | "jobTitle" | "status";
  sortDir: "asc" | "desc";
  paging: {
    mode: "offset";
    page: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};
