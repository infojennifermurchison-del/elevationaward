// Lightweight localStorage-backed data layer with a pub/sub so React views
// stay in sync. Stands in for a real backend API; swap these functions for
// fetch() calls when a server is available.

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "scored"
  | "awarded"
  | "rejected";

export interface ScoreCriteria {
  innovation: number;
  impact: number;
  feasibility: number;
  presentation: number;
}

export interface Score {
  id: string;
  applicationId: string;
  evaluatorEmail: string;
  evaluatorName: string;
  criteria: ScoreCriteria;
  comments: string;
  createdAt: string;
}

export interface Application {
  id: string;
  applicantName: string;
  email: string;
  organization: string;
  category: string;
  title: string;
  summary: string;
  impact: string;
  status: ApplicationStatus;
  createdAt: string;
}

export type EvaluatorStatus = "invited" | "active";

export interface Evaluator {
  id: string;
  name: string;
  email: string;
  status: EvaluatorStatus;
  invitedAt: string;
  assignments: string[]; // application ids
}

interface DB {
  applications: Application[];
  evaluators: Evaluator[];
  scores: Score[];
}

const KEY = "elevationaward-db";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(): DB {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as DB;
    } catch {
      /* fall through to seed */
    }
  }
  const seeded = seed();
  write(seeded);
  return seeded;
}

function write(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  emit();
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------- Applications ----------

export function getApplications(): Application[] {
  return read().applications.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getApplication(id: string): Application | undefined {
  return read().applications.find((a) => a.id === id);
}

export function addApplication(
  data: Omit<Application, "id" | "status" | "createdAt">,
): Application {
  const db = read();
  const app: Application = {
    ...data,
    id: uid("app"),
    status: "submitted",
    createdAt: nowIso(),
  };
  db.applications.push(app);
  write(db);
  return app;
}

export function updateApplication(id: string, patch: Partial<Application>) {
  const db = read();
  const idx = db.applications.findIndex((a) => a.id === id);
  if (idx >= 0) {
    db.applications[idx] = { ...db.applications[idx], ...patch };
    write(db);
  }
}

// ---------- Evaluators ----------

export function getEvaluators(): Evaluator[] {
  return read().evaluators;
}

export function getEvaluator(id: string): Evaluator | undefined {
  return read().evaluators.find((e) => e.id === id);
}

export function getEvaluatorByEmail(email: string): Evaluator | undefined {
  return read().evaluators.find(
    (e) => e.email.toLowerCase() === email.toLowerCase(),
  );
}

export function addEvaluator(name: string, email: string): Evaluator {
  const db = read();
  const existing = db.evaluators.find(
    (e) => e.email.toLowerCase() === email.toLowerCase(),
  );
  if (existing) return existing;
  const evaluator: Evaluator = {
    id: uid("ev"),
    name,
    email,
    status: "invited",
    invitedAt: nowIso(),
    assignments: [],
  };
  db.evaluators.push(evaluator);
  write(db);
  return evaluator;
}

export function updateEvaluator(id: string, patch: Partial<Evaluator>) {
  const db = read();
  const idx = db.evaluators.findIndex((e) => e.id === id);
  if (idx >= 0) {
    db.evaluators[idx] = { ...db.evaluators[idx], ...patch };
    write(db);
  }
}

export function removeEvaluator(id: string) {
  const db = read();
  db.evaluators = db.evaluators.filter((e) => e.id !== id);
  write(db);
}

export function acceptInvite(email: string): Evaluator | undefined {
  const db = read();
  const idx = db.evaluators.findIndex(
    (e) => e.email.toLowerCase() === email.toLowerCase(),
  );
  if (idx < 0) return undefined;
  db.evaluators[idx].status = "active";
  write(db);
  return db.evaluators[idx];
}

export function assignEvaluator(applicationId: string, evaluatorId: string) {
  const db = read();
  const idx = db.evaluators.findIndex((e) => e.id === evaluatorId);
  if (idx < 0) return;
  const set = new Set(db.evaluators[idx].assignments);
  set.add(applicationId);
  db.evaluators[idx].assignments = [...set];
  write(db);
}

export function unassignEvaluator(applicationId: string, evaluatorId: string) {
  const db = read();
  const idx = db.evaluators.findIndex((e) => e.id === evaluatorId);
  if (idx < 0) return;
  db.evaluators[idx].assignments = db.evaluators[idx].assignments.filter(
    (a) => a !== applicationId,
  );
  write(db);
}

export function getAssignmentsForEvaluator(email: string): Application[] {
  const db = read();
  const evaluator = db.evaluators.find(
    (e) => e.email.toLowerCase() === email.toLowerCase(),
  );
  if (!evaluator) return [];
  return db.applications.filter((a) => evaluator.assignments.includes(a.id));
}

// ---------- Scores ----------

export function getScores(): Score[] {
  return read().scores;
}

export function getScoresForApplication(applicationId: string): Score[] {
  return read().scores.filter((s) => s.applicationId === applicationId);
}

export function hasScored(applicationId: string, evaluatorEmail: string) {
  return read().scores.some(
    (s) =>
      s.applicationId === applicationId &&
      s.evaluatorEmail.toLowerCase() === evaluatorEmail.toLowerCase(),
  );
}

export function addScore(data: Omit<Score, "id" | "createdAt">): Score {
  const db = read();
  const score: Score = { ...data, id: uid("score"), createdAt: nowIso() };
  db.scores.push(score);
  // Move the application into "scored" once at least one score exists.
  const appIdx = db.applications.findIndex((a) => a.id === data.applicationId);
  if (appIdx >= 0 && db.applications[appIdx].status === "under_review") {
    db.applications[appIdx].status = "scored";
  }
  write(db);
  return score;
}

export function averageScore(applicationId: string): number | null {
  const scores = getScoresForApplication(applicationId);
  if (scores.length === 0) return null;
  const total = scores.reduce((sum, s) => {
    const { innovation, impact, feasibility, presentation } = s.criteria;
    return sum + innovation + impact + feasibility + presentation;
  }, 0);
  // 4 criteria, each out of 10 => max 40 per score.
  return total / scores.length;
}

// ---------- Seed data ----------

function seed(): DB {
  const created = new Date();
  const iso = (daysAgo: number) =>
    new Date(created.getTime() - daysAgo * 86400000).toISOString();

  const applications: Application[] = [
    {
      id: "app_seed1",
      applicantName: "Maya Okafor",
      email: "maya@brightpaths.org",
      organization: "Bright Paths Initiative",
      category: "Community Impact",
      title: "Mobile STEM Labs for Rural Schools",
      summary:
        "A fleet of retrofitted vans bringing hands-on science and coding labs to under-resourced rural districts.",
      impact:
        "Reached 4,200 students across 18 districts in the first year, with a 31% increase in STEM course enrollment.",
      status: "under_review",
      createdAt: iso(6),
    },
    {
      id: "app_seed2",
      applicantName: "Daniel Reyes",
      email: "daniel@greenloop.io",
      organization: "GreenLoop",
      category: "Sustainability",
      title: "Neighborhood Composting Network",
      summary:
        "A peer-to-peer composting logistics platform that diverts household food waste from landfills.",
      impact:
        "Diverted 120 tons of organic waste and created 14 part-time green jobs in its pilot city.",
      status: "scored",
      createdAt: iso(9),
    },
    {
      id: "app_seed3",
      applicantName: "Priya Nair",
      email: "priya@carebridge.health",
      organization: "CareBridge",
      category: "Health & Wellbeing",
      title: "Telehealth for Elder Care Deserts",
      summary:
        "Connecting homebound seniors with clinicians and community health workers through a simple tablet interface.",
      impact:
        "Reduced avoidable ER visits by 22% among 800 enrolled patients.",
      status: "submitted",
      createdAt: iso(2),
    },
  ];

  const evaluators: Evaluator[] = [
    {
      id: "ev_seed1",
      name: "Dr. Alan Whitfield",
      email: "alan@panel.org",
      status: "active",
      invitedAt: iso(20),
      assignments: ["app_seed1", "app_seed2"],
    },
    {
      id: "ev_seed2",
      name: "Grace Lindqvist",
      email: "grace@panel.org",
      status: "invited",
      invitedAt: iso(4),
      assignments: ["app_seed2"],
    },
  ];

  const scores: Score[] = [
    {
      id: "score_seed1",
      applicationId: "app_seed2",
      evaluatorEmail: "alan@panel.org",
      evaluatorName: "Dr. Alan Whitfield",
      criteria: { innovation: 8, impact: 9, feasibility: 7, presentation: 8 },
      comments:
        "Strong measurable impact and a scalable model. Feasibility depends on municipal partnerships.",
      createdAt: iso(3),
    },
  ];

  return { applications, evaluators, scores };
}

export function resetDb() {
  localStorage.removeItem(KEY);
  emit();
}
