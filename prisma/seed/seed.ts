/**
 * prisma/seed/seed.ts
 *
 * Full-featured seed for Visondyna Job Board
 * - Wipes data in FK-safe order
 * - Seeds Categories + SkillTags aligned to local market coverage
 * - Seeds Users (ADMIN, HR, APPLICANT) with hashed passwords
 * - Seeds Profiles (+ Education, Experience, ApplicantSkillTags)
 * - Seeds Jobs (with postedBy HR, Category, and JobSkillTags)
 * - Seeds Applications (unique per [applicantId, jobId], formData JSON)
 * - Seeds Conversations + Messages between applicants and HR/Admin
 * - Seeds EmailVerificationTokens (tokenHash)
 *
 * Run:
 *   npx prisma db seed
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";

// ------------------------- Tunables -------------------------
// ------------------------- Tunables -------------------------
const N_APPLICANTS = 5;
const N_HR = 1;
const N_ADMINS = 1;
const N_JOBS = 5;

const MAX_EDUCATIONS_PER_PROFILE = 1;
const MAX_EXPERIENCES_PER_PROFILE = 1;
const MAX_SKILLS_PER_PROFILE = 3;

const MAX_APPLICATIONS_PER_USER = 2;
const FRACTION_APPLICANTS_WITH_CONVO = 0.2;

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || "password123";
const BCRYPT_ROUNDS = 10;

// Job skill linking
const MIN_JOB_SKILLS = 1;
const MAX_JOB_SKILLS = 2;

// Fixed known accounts
const FIXED_ADMIN_EMAIL = "admin@visondyna.local";
const FIXED_HR_EMAIL = "hr@visondyna.local";
const FIXED_APPLICANT_EMAIL = "applicant@visondyna.local";

// ------------------------- Data Pools -------------------------
const FIRST_NAMES = [
  "Juan",
  "Jose",
  "Maria",
  "Ana",
  "Carlos",
  "Mark",
  "John",
  "Jane",
  "Luis",
  "Miguel",
  "Ethan",
  "Sophia",
  "Isabella",
  "Noah",
  "Liam",
  "Olivia",
  "Emma",
  "Ava",
  "Mia",
  "Daniel",
];

const LAST_NAMES = [
  "Dela Cruz",
  "Santos",
  "Garcia",
  "Reyes",
  "Lopez",
  "Martinez",
  "Anderson",
  "Brown",
  "Nguyen",
  "Kim",
  "Smith",
  "Johnson",
  "Torres",
  "Ramirez",
  "Cruz",
  "Mendoza",
  "Ortiz",
  "Rivera",
  "Gonzales",
  "Flores",
];

const COMPANIES = [
  "Visondyna",
  "MetroCorp",
  "Acme Services",
  "Global Solutions",
  "BrightHire",
  "Sunrise Inc",
  "BlueStar",
  "Evergreen Co",
  "NextWave",
  "HarborWorks",
];

const LOCATIONS = [
  "West Aeropark, Clark Freeport Zone",
  "Clark Freeport Zone, Pampanga",
  "Angeles City, Pampanga",
  "Balibago, Angeles City",
  "Friendship Highway, Angeles City",
  "Nepo Center, Angeles City",
  "Mabalacat City, Pampanga",
  "Dau, Mabalacat City",
  "San Fernando City, Pampanga",
  "Porac, Pampanga",
];

// Local market-aligned categories + skills
const categorySeeds: Array<{ name: string; skills: string[] }> = [
  {
    name: "Cleaning & Maintenance Services",
    skills: [
      "Facility and Maintenance Services",
      "Janitorial",
      "Utility Services",
      "Housekeeping",
      "Gardening and Groundskeeping",
    ],
  },
  {
    name: "Industrial & Skilled Labor",
    skills: ["Production Workers", "Skilled Labor", "General Labor"],
  },
  {
    name: "Clerical & Office Support",
    skills: [
      "Administrative Assistants",
      "Clerical Staff",
      "Office Support Personnel",
    ],
  },
  {
    name: "Hospitality & Guest Services",
    skills: [
      "Front Desk Personnel",
      "Food and Beverage Crew",
      "Hotel and Resort Staff",
      "Room Attendants",
    ],
  },
  {
    name: "Retail & Event Staffing",
    skills: ["Event Crew", "Retail Staff"],
  },
];

const JOB_TITLES_BY_CATEGORY: Record<string, string[]> = {
  "Cleaning & Maintenance Services": [
    "Janitor",
    "Housekeeping Staff",
    "Utility Worker",
    "Maintenance Assistant",
    "Groundskeeping Staff",
    "Facility Cleaner",
  ],
  "Industrial & Skilled Labor": [
    "Production Worker",
    "General Laborer",
    "Skilled Worker",
    "Warehouse Assistant",
    "Forklift Operator",
    "Maintenance Technician",
  ],
  "Clerical & Office Support": [
    "Administrative Assistant",
    "Office Clerk",
    "Data Entry Clerk",
    "Office Support Staff",
    "Clerical Assistant",
  ],
  "Hospitality & Guest Services": [
    "Front Desk Associate",
    "Food Service Crew",
    "Hotel Staff",
    "Room Attendant",
    "Guest Service Assistant",
    "Restaurant Service Crew",
  ],
  "Retail & Event Staffing": [
    "Retail Sales Associate",
    "Store Staff",
    "Event Crew Member",
    "Promotional Staff",
    "Cashier",
  ],
};

const ALL_LOCAL_JOB_TITLES = Object.values(JOB_TITLES_BY_CATEGORY).flat();

const ROLE_SUMMARY_SNIPPETS = [
  "Support daily operations to maintain service quality and safety standards.",
  "Collaborate across teams to meet targets, SLAs, and customer expectations.",
  "Uphold cleanliness, organization, and compliance within assigned areas.",
  "Provide responsive assistance to colleagues and clients as needed.",
  "Use checklists and SOPs to consistently complete assigned tasks.",
];

const RESPONSIBILITY_SNIPPETS = [
  "Execute assigned tasks efficiently and accurately.",
  "Coordinate with supervisors to meet shift goals.",
  "Maintain tools, equipment, and workspaces in good condition.",
  "Follow safety procedures and report incidents immediately.",
  "Assist in inventory counts and stock rotation when required.",
  "Deliver courteous service and answer basic inquiries.",
  "Document work progress and escalate issues promptly.",
];

const QUALIFICATION_SNIPPETS = [
  "High school diploma or equivalent preferred.",
  "Relevant experience in a similar role is an advantage.",
  "Ability to follow instructions and work with minimal supervision.",
  "Basic computer literacy and record-keeping skills are a plus.",
  "Physically fit to perform role-specific tasks.",
  "Good communication and teamwork skills.",
];

// ------------------------- Utils -------------------------
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randN(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickUnique<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];

  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }

  return out;
}

function uniqueEmail(first: string, last: string, idx: number) {
  const safeFirst = first.toLowerCase().replace(/\s+/g, "");
  const safeLast = last.toLowerCase().replace(/\s+/g, "");
  return `${safeFirst}.${safeLast}+${idx}@example.com`;
}

function randomDateBetweenYearsAgo(minYearsAgo = 20, maxYearsAgo = 40) {
  const now = Date.now();
  const yearsAgo = minYearsAgo + Math.random() * (maxYearsAgo - minYearsAgo);
  const ts = now - yearsAgo * 365 * 24 * 60 * 60 * 1000;
  return new Date(ts);
}

function phonePH(): string {
  return `+63 9${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function randomTitle(categoryName: string): string {
  const titles = JOB_TITLES_BY_CATEGORY[categoryName] ?? ["General Worker"];
  const title = rand(titles);
  const suffix =
    Math.random() > 0.8
      ? ` (${["Part-time", "Full-time", "Contract"][Math.floor(Math.random() * 3)]})`
      : "";

  return `${title}${suffix}`;
}

function buildJobDescription(title: string, company: string): string {
  const summary = pickUnique(ROLE_SUMMARY_SNIPPETS, randN(2, 3)).join(" ");
  const responsibilities = pickUnique(RESPONSIBILITY_SNIPPETS, randN(4, 6))
    .map((s) => `• ${s}`)
    .join("\n");
  const qualifications = pickUnique(QUALIFICATION_SNIPPETS, randN(3, 5))
    .map((s) => `• ${s}`)
    .join("\n");

  return [
    `${title} — ${company}`,
    "",
    "Role Summary",
    summary,
    "",
    "Key Responsibilities",
    responsibilities,
    "",
    "Qualifications",
    qualifications,
  ].join("\n");
}

async function hashTokenForDB(token: string): Promise<string> {
  return bcrypt.hash(token, BCRYPT_ROUNDS);
}

// ------------------------- Main Seeder -------------------------
async function main() {
  console.info("==== SEED START ====");

  // ---------- 0) FK-safe wipe ----------
  console.info("Cleaning existing data (FK-safe order)...");
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});

  await prisma.notification.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.savedJob.deleteMany({});
  await prisma.jobSkillTag.deleteMany({});
  await prisma.experience.deleteMany({});
  await prisma.education.deleteMany({});
  await prisma.applicantSkillTag.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.emailVerificationToken.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { endsWith: "@example.com" } },
        { email: { endsWith: "@admin.example.com" } },
        { email: { endsWith: "@hr.example.com" } },
        { email: FIXED_ADMIN_EMAIL },
        { email: FIXED_HR_EMAIL },
        { email: FIXED_APPLICANT_EMAIL },
      ],
    },
  });
  await prisma.skillTag.deleteMany({});
  await prisma.category.deleteMany({});

  // ---------- 1) Seed Categories + SkillTags ----------
  console.info("Seeding categories + skill tags...");
  const categories: { id: string; name: string }[] = [];

  for (const cat of categorySeeds) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        skills: {
          create: cat.skills.map((s) => ({ name: s })),
        },
      },
      select: { id: true, name: true },
    });

    categories.push(created);
  }

  const allSkillTags = await prisma.skillTag.findMany({
    select: { id: true, name: true, categoryId: true },
  });

  console.info(
    `  Categories: ${categories.length}, SkillTags: ${allSkillTags.length}`,
  );

  // ---------- 2) Seed Users ----------
  console.info("Seeding users...");
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  // Fixed known accounts
  const fixedAdmin = await prisma.user.upsert({
    where: { email: FIXED_ADMIN_EMAIL },
    update: {
      firstname: "System",
      lastname: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      gender: "male",
      birthDate: new Date("1998-01-01"),
      emailVerified: new Date(),
      deletedAt: null,
      isSuspended: false,
    },
    create: {
      firstname: "System",
      lastname: "Admin",
      email: FIXED_ADMIN_EMAIL,
      password: hashedPassword,
      role: "ADMIN",
      gender: "male",
      birthDate: new Date("1998-01-01"),
      emailVerified: new Date(),
      isSuspended: false,
    },
    select: { id: true, email: true },
  });

  const fixedHr = await prisma.user.upsert({
    where: { email: FIXED_HR_EMAIL },
    update: {
      firstname: "Default",
      lastname: "HR",
      password: hashedPassword,
      role: "HR",
      gender: "female",
      birthDate: new Date("1999-01-01"),
      emailVerified: new Date(),
      deletedAt: null,
      isSuspended: false,
    },
    create: {
      firstname: "Default",
      lastname: "HR",
      email: FIXED_HR_EMAIL,
      password: hashedPassword,
      role: "HR",
      gender: "female",
      birthDate: new Date("1999-01-01"),
      emailVerified: new Date(),
      isSuspended: false,
    },
    select: { id: true, email: true },
  });

  const fixedApplicantUser = await prisma.user.upsert({
    where: { email: FIXED_APPLICANT_EMAIL },
    update: {
      firstname: "Test",
      lastname: "Applicant",
      password: hashedPassword,
      role: "APPLICANT",
      gender: "male",
      birthDate: new Date("2000-01-01"),
      emailVerified: new Date(),
      deletedAt: null,
      isSuspended: false,
    },
    create: {
      firstname: "Test",
      lastname: "Applicant",
      email: FIXED_APPLICANT_EMAIL,
      password: hashedPassword,
      role: "APPLICANT",
      gender: "male",
      birthDate: new Date("2000-01-01"),
      emailVerified: new Date(),
      isSuspended: false,
    },
    select: { id: true },
  });

  const fixedApplicantProfile = await prisma.profile.create({
    data: {
      userId: fixedApplicantUser.id,
      profession: "General Worker",
      phone: phonePH(),
      profileSummary:
        "Motivated applicant with strong teamwork skills and willingness to learn.",
      profileCompleted: true,
    },
    select: { id: true },
  });

  const admins: { id: string; email: string }[] = [fixedAdmin];
  for (let i = 0; i < N_ADMINS; i++) {
    const first = rand(FIRST_NAMES);
    const last = rand(LAST_NAMES);
    const email = uniqueEmail(first, last, i + 1).replace(
      "@example.com",
      "@admin.example.com",
    );

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstname: first,
        lastname: last,
        password: hashedPassword,
        role: "ADMIN",
        gender: Math.random() > 0.5 ? "male" : "female",
        birthDate: randomDateBetweenYearsAgo(28, 45),
        emailVerified: new Date(),
        deletedAt: null,
        isSuspended: false,
      },
      create: {
        firstname: first,
        lastname: last,
        email,
        password: hashedPassword,
        role: "ADMIN",
        gender: Math.random() > 0.5 ? "male" : "female",
        birthDate: randomDateBetweenYearsAgo(28, 45),
        emailVerified: new Date(),
        isSuspended: false,
      },
      select: { id: true, email: true },
    });

    admins.push(user);
  }

  const hrs: { id: string; email: string }[] = [fixedHr];
  for (let i = 0; i < N_HR; i++) {
    const first = rand(FIRST_NAMES);
    const last = rand(LAST_NAMES);
    const email = uniqueEmail(first, last, i + 1).replace(
      "@example.com",
      "@hr.example.com",
    );

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstname: first,
        lastname: last,
        password: hashedPassword,
        role: "HR",
        gender: Math.random() > 0.5 ? "male" : "female",
        birthDate: randomDateBetweenYearsAgo(24, 40),
        emailVerified: new Date(),
        deletedAt: null,
        isSuspended: false,
      },
      create: {
        firstname: first,
        lastname: last,
        email,
        password: hashedPassword,
        role: "HR",
        gender: Math.random() > 0.5 ? "male" : "female",
        birthDate: randomDateBetweenYearsAgo(24, 40),
        emailVerified: new Date(),
        isSuspended: false,
      },
      select: { id: true, email: true },
    });

    hrs.push(user);
  }

  const applicants: { id: string; profileId: string }[] = [
    { id: fixedApplicantUser.id, profileId: fixedApplicantProfile.id },
  ];

  for (let i = 0; i < N_APPLICANTS; i++) {
    const first = rand(FIRST_NAMES);
    const last = rand(LAST_NAMES);
    const email = uniqueEmail(first, last, i + 1);

    const user = await prisma.user.create({
      data: {
        firstname: first,
        lastname: last,
        email,
        password: hashedPassword,
        role: "APPLICANT",
        gender: Math.random() > 0.5 ? "male" : "female",
        birthDate: randomDateBetweenYearsAgo(20, 40),
        emailVerified: Math.random() > 0.6 ? new Date() : null,
      },
      select: { id: true },
    });

    if (Math.random() > 0.7) {
      const tokenRaw = crypto.randomBytes(24).toString("hex");
      const tokenHash = await hashTokenForDB(tokenRaw);

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        },
      });
    }

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        profession:
          Math.random() > 0.4 ? rand(ALL_LOCAL_JOB_TITLES) : "General Worker",
        phone: phonePH(),
        profileSummary: `Motivated ${rand(ALL_LOCAL_JOB_TITLES)} with strong teamwork skills. ${rand(ROLE_SUMMARY_SNIPPETS)}`,
        profileCompleted: Math.random() > 0.3,
      },
      select: { id: true },
    });

    const eduCount = randN(0, MAX_EDUCATIONS_PER_PROFILE);
    for (let e = 0; e < eduCount; e++) {
      const enrolled = new Date(
        Date.now() - randN(5, 12) * 365 * 24 * 60 * 60 * 1000,
      );
      const grad = new Date(
        enrolled.getTime() + randN(2, 5) * 365 * 24 * 60 * 60 * 1000,
      );

      await prisma.education.create({
        data: {
          course: rand([
            "BS Information Technology",
            "Associate in Computer Tech",
            "Diploma in Hospitality",
            "High School Diploma",
            "Bachelor of Science",
          ]),
          institution: rand([
            "University of the Philippines",
            "De La Salle",
            "Ateneo",
            "Visondyna Training Center",
            "Global Tech Institute",
          ]),
          graduated: Math.random() > 0.5,
          enrolledDate: enrolled,
          graduationDate: grad,
          applicantProfileId: profile.id,
        },
      });
    }

    const expCount = randN(0, MAX_EXPERIENCES_PER_PROFILE);
    for (let ex = 0; ex < expCount; ex++) {
      const start = new Date(
        Date.now() - randN(6, 60) * 30 * 24 * 60 * 60 * 1000,
      );
      const end =
        Math.random() > 0.4
          ? new Date(start.getTime() + randN(6, 36) * 30 * 24 * 60 * 60 * 1000)
          : null;

      await prisma.experience.create({
        data: {
          job: rand(ALL_LOCAL_JOB_TITLES),
          company: rand(COMPANIES),
          startDate: start,
          lastAttended: end ?? undefined,
          profileId: profile.id,
        },
      });
    }

    const skillCount = randN(
      0,
      Math.min(MAX_SKILLS_PER_PROFILE, allSkillTags.length),
    );
    const chosenSkillIds = pickUnique(
      allSkillTags.map((s) => s.id),
      skillCount,
    );

    if (chosenSkillIds.length) {
      await prisma.applicantSkillTag.createMany({
        data: chosenSkillIds.map((skillId) => ({
          profileId: profile.id,
          skillId,
        })),
        skipDuplicates: true,
      });
    }

    applicants.push({ id: user.id, profileId: profile.id });

    if ((i + 1) % 10 === 0) {
      console.info(`  - Applicants created: ${i + 1}`);
    }
  }

  // ---------- 3) Seed Jobs ----------
  console.info(`Seeding ${N_JOBS} jobs...`);
  const jobIds: string[] = [];

  for (let i = 0; i < N_JOBS; i++) {
    const category = rand(categories);
    const title = randomTitle(category.name);
    const location = rand(LOCATIONS);
    const company = rand(COMPANIES);
    const salary = Math.round(12000 + Math.random() * 28000);
    const manpower = randN(1, 40);
    const poster = rand(hrs.length ? hrs : admins);

    const description = buildJobDescription(title, company);

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        company,
        salary,
        manpower,
        status: "OPEN",
        category: { connect: { id: category.id } },
        postedBy: poster ? { connect: { id: poster.id } } : undefined,
      },
      select: { id: true, categoryId: true },
    });

    jobIds.push(job.id);

    const categorySkills = allSkillTags.filter(
      (s) => s.categoryId === job.categoryId,
    );

    if (categorySkills.length) {
      const k = randN(
        MIN_JOB_SKILLS,
        Math.min(MAX_JOB_SKILLS, categorySkills.length),
      );
      const chosen = pickUnique(categorySkills, k);

      await prisma.jobSkillTag.createMany({
        data: chosen.map((s) => ({
          jobId: job.id,
          skillTagId: s.id,
        })),
        skipDuplicates: true,
      });
    }

    if ((i + 1) % 20 === 0) {
      console.info(`  - Jobs created: ${i + 1}`);
    }
  }

  // ---------- 4) Seed Applications ----------
  console.info("Seeding applications...");
  for (let ui = 0; ui < applicants.length; ui++) {
    const applicant = applicants[ui];
    const appsCount = randN(
      1,
      Math.min(MAX_APPLICATIONS_PER_USER, jobIds.length),
    );
    const chosenJobIdxs = pickUnique(
      [...Array(jobIds.length).keys()],
      appsCount,
    );

    for (const idx of chosenJobIdxs) {
      const jobId = jobIds[idx];

      await prisma.application.create({
        data: {
          jobId,
          applicantId: applicant.id,
          formData: {
            coverLetter: `Hello, I’m interested in this role. ${rand(ROLE_SUMMARY_SNIPPETS)}`,
            resumeUrl: null,
            answers: [
              {
                q: "Available to start?",
                a: Math.random() > 0.5 ? "Yes" : "Within 2 weeks",
              },
              { q: "Preferred shift", a: rand(["Day", "Night", "Flexible"]) },
            ],
          },
        },
      });
    }

    if ((ui + 1) % 10 === 0) {
      console.info(`  - Applications created for ${ui + 1} applicants`);
    }
  }

  // ---------- 5) Seed Conversations + Messages ----------
  console.info("Seeding conversations + messages...");
  const postersForMessaging = [...hrs, ...admins];
  let totalConvos = 0;
  let totalMessages = 0;

  for (const applicant of applicants) {
    if (Math.random() > FRACTION_APPLICANTS_WITH_CONVO) continue;

    const subject = rand([
      "Application Status Inquiry",
      "Follow-up on Interview",
      "Clarification on Job Requirements",
      "Schedule Availability",
      "Document Submission",
    ]);

    const convo = await prisma.conversation.create({
      data: {
        applicantProfileId: applicant.profileId,
        subject,
        lastMessageAt: new Date(),
      },
      select: { id: true },
    });

    totalConvos++;

    const chainLen = randN(2, 4);
    const lastAt = Date.now() - chainLen * 60 * 1000;

    for (let i = 0; i < chainLen; i++) {
      const isApplicant = i % 2 === 0;
      const senderRole = isApplicant
        ? ("APPLICANT" as const)
        : Math.random() > 0.5
          ? ("HR" as const)
          : ("ADMIN" as const);

      const staff = isApplicant ? null : rand(postersForMessaging);

      const content = isApplicant
        ? rand([
            "Hi, I want to check my application status. Thank you!",
            "Good day! May I ask about the interview schedule?",
            "Hello, what documents do I still need to submit?",
          ])
        : rand([
            "Thanks for reaching out. We’ll review and update you shortly.",
            "Please upload your latest resume to proceed.",
            "Your application is under review. Expect feedback within the week.",
          ]);

      const msg = await prisma.message.create({
        data: {
          conversationId: convo.id,
          senderRole,
          senderUserId: staff ? staff.id : null,
          content,
          createdAt: new Date(lastAt + i * 60 * 1000),
          readAt: Math.random() > 0.6 ? new Date() : null,
        },
      });

      totalMessages++;

      await prisma.conversation.update({
        where: { id: convo.id },
        data: { lastMessageAt: msg.createdAt },
      });
    }
  }

  // ---------- Summary ----------
  const [uCount, jCount, aCount, cCount, sCount] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.category.count(),
    prisma.skillTag.count(),
  ]);

  console.info("==== SEED COMPLETE ====");
  console.info(
    `  Users total: ${uCount} (Admins: ${N_ADMINS + 1}, HR: ${N_HR + 1}, Applicants: ${N_APPLICANTS + 1})`,
  );
  console.info(`  Jobs: ${jCount}`);
  console.info(`  Applications: ${aCount}`);
  console.info(`  Categories: ${cCount}, SkillTags: ${sCount}`);
  console.info(`  Conversations: ${totalConvos}, Messages: ${totalMessages}`);
  console.info("");
  console.info("Known login accounts:");
  console.info(`  Admin: ${FIXED_ADMIN_EMAIL} / ${DEFAULT_PASSWORD}`);
  console.info(`  HR: ${FIXED_HR_EMAIL} / ${DEFAULT_PASSWORD}`);
  console.info(`  Applicant: ${FIXED_APPLICANT_EMAIL} / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });