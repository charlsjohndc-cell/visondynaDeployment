import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { toTitleCase } from "./utils";
import type { ApplicationStatus, JobStatus } from "@prisma/client";

type JobDetails = {
  id: string;
  title: string;
  description: string;
  manpower: number;
  salary: number;
  company: string;
  location: string;
  status: JobStatus;
  createdAt: string;
  category: { id: string; name: string };
  skills: { id: string; name: string }[];
  applications: Application[];
};

type Application = {
  id: string;
  applicantId: string;
  name: string;
  email: string;
  formData: JSON;
  status: ApplicationStatus;
  submittedAt: string;
};

type Applicant = {
  id: string;
  image: string;
  name: string;
  email: string;
  phone: number;
  summary: string;
  profession: string;
  skills: { skill: { name: string } }[];
  education: {
    course: string;
    institution: string;
    graduated: boolean;
    enrolledDate: Date | string | null;
    graduationDate: Date | string | null;
  }[];
  experience: {
    job: string;
    company: string;
    startDate: Date | string | null;
    lastAttended: Date | string | null;
  }[];
};

type JsPdfWithGState = jsPDF & {
  GState?: new (options: { opacity?: number }) => unknown;
  setGState?: (state: unknown) => void;
};

function wrapText(doc: jsPDF, text: string, width: number): string[] {
  return doc.splitTextToSize(text || "", width) as string[];
}

function safeFormatMonthYear(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "MMM yyyy");
}

function formatPeso(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return "Not specified";
  }
  const rounded = Math.round(amount);
  const withCommas = rounded.toLocaleString();
  return `${withCommas}`;
}

/**
 * Add semi-transparent centered logo watermark on every page.
 * Uses /Logo.png from the public folder.
 */
async function addWatermark(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.src = "/Logo.png";
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(e);
  });

  const logoWidth = pageWidth * 0.5;
  const logoHeight = (img.height / img.width) * logoWidth;
  const x = (pageWidth - logoWidth) / 2;
  const y = (pageHeight - logoHeight) / 2;

  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    const anyDoc = doc as JsPdfWithGState;

    if (anyDoc.GState && anyDoc.setGState) {
      const gState = new anyDoc.GState({ opacity: 0.25 });
      anyDoc.setGState(gState);
      doc.addImage(img, "PNG", x, y, logoWidth, logoHeight, undefined, "FAST");
      const resetState = new anyDoc.GState({ opacity: 1 });
      anyDoc.setGState(resetState);
    } else {
      doc.addImage(img, "PNG", x, y, logoWidth, logoHeight, undefined, "FAST");
    }
  }
}

export default async function exportToPdf(
  application: Application,
  job: JobDetails,
) {
  const doc = new jsPDF({ format: "letter" });

  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();

  const MARGIN_LEFT = 20;
  const MARGIN_RIGHT = 20;
  const TOP_MARGIN = 24;
  const BOTTOM_MARGIN = PAGE_HEIGHT - 20;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const LINE_HEIGHT = 5;

  const BRAND_GREEN = "#84cc16";
  const HEADING_COLOR = "#111827";
  const BODY_COLOR = "#4b5563";
  const MUTED_COLOR = "#6b7280";

  const HEADING_TO_CONTENT = 5;
  const SECTION_GAP = 9;
  const HEADER_BOTTOM_GAP = 8;

  let applicant: Applicant | undefined;

  try {
    const res = await fetch(`/api/applicant/${application.applicantId}`);
    const data = await res.json();

    if (res.ok && data?.ok && data?.data) {
      applicant = data.data as Applicant;
    } else {
      console.warn("exportToPdf applicant fetch failed:", {
        status: res.status,
        body: data,
        application,
      });
    }
  } catch (error) {
    console.error("exportToPdf applicant fetch error:", error, application);
  }

  doc.setProperties({ title: application.name || "Applicant Export" });

  let cursorY = TOP_MARGIN;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > BOTTOM_MARGIN) {
      doc.addPage();
      cursorY = TOP_MARGIN;
    }
  };

  // ===========================
  // PAGE 1 – APPLICANT PREVIEW
  // ===========================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BRAND_GREEN);
  doc.text("VISONDYNA", MARGIN_LEFT, cursorY);

  const submittedDate = format(
    new Date(application.submittedAt),
    "MMM dd, yyyy",
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED_COLOR);
  doc.text(submittedDate, PAGE_WIDTH - MARGIN_RIGHT, cursorY, {
    align: "right",
  });

  cursorY += 6;

  doc.setDrawColor("#e5e7eb");
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, cursorY, PAGE_WIDTH - MARGIN_RIGHT, cursorY);

  cursorY += HEADER_BOTTOM_GAP;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(HEADING_COLOR);
  doc.text(
    applicant?.name ?? application.name ?? "Unnamed Applicant",
    MARGIN_LEFT,
    cursorY,
  );

  cursorY += 6;

  if (applicant?.profession) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(BODY_COLOR);
    doc.text(applicant.profession, MARGIN_LEFT, cursorY);
    cursorY += 6;
  } else {
    cursorY += 4;
  }

  doc.setFontSize(10);
  doc.setTextColor(MUTED_COLOR);
  doc.setFont("helvetica", "normal");

  const emailText = applicant?.email || application.email || "N/A";
  const separator = "   |   ";
  const phoneText = applicant?.phone ? `${applicant.phone}` : "N/A";

  doc.text(emailText, MARGIN_LEFT, cursorY);
  const emailWidth = doc.getTextWidth(emailText);
  const separatorWidth = doc.getTextWidth(separator);
  const phoneX = MARGIN_LEFT + emailWidth + separatorWidth;
  doc.text(phoneText, phoneX, cursorY);

  cursorY += 6;

  doc.setDrawColor("#e5e7eb");
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, cursorY, PAGE_WIDTH - MARGIN_RIGHT, cursorY);

  cursorY += SECTION_GAP;

  // SUMMARY
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(HEADING_COLOR);
  doc.text("Summary", MARGIN_LEFT, cursorY);

  cursorY += HEADING_TO_CONTENT;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BODY_COLOR);

  let lines = wrapText(
    doc,
    applicant?.summary || "No summary provided.",
    CONTENT_WIDTH,
  );
  let blockHeight = lines.length * LINE_HEIGHT;
  ensureSpace(blockHeight);
  doc.text(lines, MARGIN_LEFT, cursorY);
  cursorY += blockHeight + SECTION_GAP;

  // KEY SKILLS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(HEADING_COLOR);
  doc.text("Key Skills", MARGIN_LEFT, cursorY);

  cursorY += HEADING_TO_CONTENT;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BODY_COLOR);

  const skillsArray =
    applicant?.skills?.map((s) => s.skill?.name).filter(Boolean) ?? [];

  if (!skillsArray.length) {
    ensureSpace(LINE_HEIGHT);
    doc.text("No skills specified.", MARGIN_LEFT, cursorY);
    cursorY += LINE_HEIGHT + SECTION_GAP;
  } else {
    skillsArray.forEach((skill) => {
      const line = `• ${skill}`;
      lines = wrapText(doc, line, CONTENT_WIDTH);
      blockHeight = lines.length * LINE_HEIGHT;
      ensureSpace(blockHeight);
      doc.text(lines, MARGIN_LEFT, cursorY);
      cursorY += blockHeight;
    });
    cursorY += SECTION_GAP;
  }

  // EDUCATION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(HEADING_COLOR);
  ensureSpace(LINE_HEIGHT * 3);
  doc.text("Education", MARGIN_LEFT, cursorY);

  cursorY += HEADING_TO_CONTENT;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BODY_COLOR);

  if (!applicant?.education || applicant.education.length === 0) {
    ensureSpace(LINE_HEIGHT);
    doc.text("No education records provided.", MARGIN_LEFT, cursorY);
    cursorY += LINE_HEIGHT + SECTION_GAP;
  } else {
    applicant.education.forEach((edu, index) => {
      const titleLine = `${edu.course || "Course not specified"} — ${
        edu.institution || "Institution not specified"
      }`;

      const dateParts: string[] = [];
      const start = safeFormatMonthYear(edu.enrolledDate);
      const end = safeFormatMonthYear(edu.graduationDate);

      if (start && end) dateParts.push(`${start} - ${end}`);
      else if (start) dateParts.push(start);
      if (edu.graduated) dateParts.push("Graduated");

      const metaLine = dateParts.join(" • ");

      const titleLines = wrapText(doc, titleLine, CONTENT_WIDTH);
      const metaLines = metaLine ? wrapText(doc, metaLine, CONTENT_WIDTH) : [];
      blockHeight = (titleLines.length + metaLines.length) * LINE_HEIGHT + 2;

      ensureSpace(blockHeight);

      doc.text(`• ${titleLines[0]}`, MARGIN_LEFT, cursorY);
      let innerY = cursorY + LINE_HEIGHT;

      if (titleLines.length > 1) {
        const rest = titleLines.slice(1);
        doc.text(rest, MARGIN_LEFT + 8, innerY);
        innerY += rest.length * LINE_HEIGHT;
      }

      if (metaLines.length) {
        doc.text(metaLines, MARGIN_LEFT + 8, innerY);
        innerY += metaLines.length * LINE_HEIGHT;
      }

      cursorY = innerY;

      if (index < applicant.education.length - 1) {
        cursorY += 4;
      }
    });

    cursorY += SECTION_GAP;
  }

  // EXPERIENCE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(HEADING_COLOR);
  ensureSpace(LINE_HEIGHT * 3);
  doc.text("Experience", MARGIN_LEFT, cursorY);

  cursorY += HEADING_TO_CONTENT;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BODY_COLOR);

  if (!applicant?.experience || applicant.experience.length === 0) {
    ensureSpace(LINE_HEIGHT);
    doc.text("No work experience records provided.", MARGIN_LEFT, cursorY);
    cursorY += LINE_HEIGHT + SECTION_GAP;
  } else {
    applicant.experience.forEach((exp, index) => {
      const titleLine = `${exp.job || "Job title not specified"} — ${
        exp.company || "Company not specified"
      }`;

      const start = safeFormatMonthYear(exp.startDate);
      const end = safeFormatMonthYear(exp.lastAttended);

      const dateLine =
        start && end ? `${start} - ${end}` : start ? start : end ? end : "";

      const titleLines = wrapText(doc, titleLine, CONTENT_WIDTH);
      const dateLines = dateLine ? wrapText(doc, dateLine, CONTENT_WIDTH) : [];
      blockHeight = (titleLines.length + dateLines.length) * LINE_HEIGHT + 2;

      ensureSpace(blockHeight);

      doc.text(`• ${titleLines[0]}`, MARGIN_LEFT, cursorY);
      let innerY = cursorY + LINE_HEIGHT;

      if (titleLines.length > 1) {
        const rest = titleLines.slice(1);
        doc.text(rest, MARGIN_LEFT + 8, innerY);
        innerY += rest.length * LINE_HEIGHT;
      }

      if (dateLines.length) {
        doc.text(dateLines, MARGIN_LEFT + 8, innerY);
        innerY += dateLines.length * LINE_HEIGHT;
      }

      cursorY = innerY;

      if (index < applicant.experience.length - 1) {
        cursorY += 4;
      }
    });
  }

  // ===========================
  // PAGE 2 – JOB PREVIEW
  // ===========================
  doc.addPage();
  cursorY = TOP_MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BRAND_GREEN);
  doc.text("VISONDYNA", MARGIN_LEFT, cursorY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED_COLOR);
  doc.text("Job Preview", PAGE_WIDTH - MARGIN_RIGHT, cursorY, {
    align: "right",
  });

  cursorY += 6;
  doc.setDrawColor("#e5e7eb");
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, cursorY, PAGE_WIDTH - MARGIN_RIGHT, cursorY);

  cursorY += HEADER_BOTTOM_GAP;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(HEADING_COLOR);
  doc.text(job.title, MARGIN_LEFT, cursorY);

  cursorY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BODY_COLOR);
  lines = wrapText(doc, `${job.company} — ${job.location}`, CONTENT_WIDTH);
  blockHeight = lines.length * LINE_HEIGHT;
  doc.text(lines, MARGIN_LEFT, cursorY);
  cursorY += blockHeight + 3;

  const statusLabel = job.status.charAt(0) + job.status.slice(1).toLowerCase();
  const postedDate = format(new Date(job.createdAt), "MMM dd, yyyy");
  const metaRow = `${statusLabel} • Posted ${postedDate}`;

  doc.setFontSize(9);
  doc.setTextColor(MUTED_COLOR);
  doc.text(metaRow, MARGIN_LEFT, cursorY);

  cursorY += 8;

  const salaryText = formatPeso(job.salary);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(HEADING_COLOR);
  doc.text("Category", MARGIN_LEFT, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BODY_COLOR);
  doc.text(toTitleCase(job.category?.name) || "N/A", MARGIN_LEFT + 22, cursorY);

  cursorY += 4;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(HEADING_COLOR);
  doc.text("Slots", MARGIN_LEFT, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BODY_COLOR);
  doc.text(`${job.manpower ?? "N/A"}`, MARGIN_LEFT + 22, cursorY);

  cursorY += 4;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(HEADING_COLOR);
  doc.text("Salary", MARGIN_LEFT, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BODY_COLOR);
  doc.text(salaryText, MARGIN_LEFT + 22, cursorY);

  cursorY += 4 + SECTION_GAP;

  // REQUIRED SKILLS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(HEADING_COLOR);
  doc.text("Required Skills", MARGIN_LEFT, cursorY);

  cursorY += HEADING_TO_CONTENT;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BODY_COLOR);

  const jobSkills = job.skills?.map((s) => s.name).filter(Boolean) ?? [];

  if (!jobSkills.length) {
    doc.text("No specific skills listed.", MARGIN_LEFT, cursorY);
    cursorY += LINE_HEIGHT + SECTION_GAP;
  } else {
    jobSkills.forEach((skillName) => {
      const line = `• ${skillName}`;
      const lines2 = wrapText(doc, line, CONTENT_WIDTH);
      blockHeight = lines2.length * LINE_HEIGHT;
      ensureSpace(blockHeight);
      doc.text(lines2, MARGIN_LEFT, cursorY);
      cursorY += blockHeight;
    });
    cursorY += SECTION_GAP;
  }

  // DESCRIPTION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(HEADING_COLOR);
  doc.text("Description", MARGIN_LEFT, cursorY);

  cursorY += HEADING_TO_CONTENT;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BODY_COLOR);

  const descriptionLines = wrapText(
    doc,
    job.description || "No job description provided.",
    CONTENT_WIDTH,
  );
  blockHeight = descriptionLines.length * LINE_HEIGHT;
  ensureSpace(blockHeight);
  doc.text(descriptionLines, MARGIN_LEFT, cursorY);
  cursorY += blockHeight + SECTION_GAP;

  await addWatermark(doc, PAGE_WIDTH, PAGE_HEIGHT);

  doc.save(`${application.id}_${application.name}`);
}