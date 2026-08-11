import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { signSession } from "./_core/session";
import { hashPassword, verifyPassword } from "./_core/password";
import {
  getUserByEmail,
  createUser,
  touchUserSignIn,
  getAllApplicationsForAdminAll,
  getApplicationById,
  getApplicationByUserId,
  getBudgetItems,
  getOrCreateApplication,
  getUploadedFiles,
  replaceBudgetItems,
  updateApplication,
  upsertUploadedFile,
  getApplicationCount,
  createEvaluatorInvite,
  getEvaluatorInviteByToken,
  getAllEvaluatorInvites,
  markInviteAccepted,
  revokeEvaluatorInvite,
  upsertEvaluatorScore,
  getScoresForApplication,
  getScoreByInviteAndApplication,
  getScoresByInviteId,
  getApplicationsRanked,
  getSiteSettings,
  updateSiteSettings,
} from "./db";
import { storagePut } from "./storage";

// ─── Deadline helper ──────────────────────────────────────────────────────────
// July 31 2026 11:59 PM Central Time (UTC-5 in summer = CDT UTC-5)
const DEADLINE_UTC = new Date("2026-08-01T04:59:00.000Z"); // July 31 11:59 PM CDT

function isDeadlinePassed(): boolean {
  return new Date() > DEADLINE_UTC;
}

// ─── Client-safe user projection ──────────────────────────────────────────────
// Never send passwordHash (or other secrets) to the browser.
function publicUser<T extends { passwordHash?: unknown }>(user: T) {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Application router ───────────────────────────────────────────────────────
const applicationRouter = router({
  // Get or create the current user's application (draft)
  getOrCreate: protectedProcedure.query(async ({ ctx }) => {
    const app = await getOrCreateApplication(ctx.user.id);
    const budget = await getBudgetItems(app.id);
    const files = await getUploadedFiles(app.id);
    return { application: app, budgetItems: budget, files };
  }),

  // Get the current user's existing application
  get: protectedProcedure.query(async ({ ctx }) => {
    const app = await getApplicationByUserId(ctx.user.id);
    if (!app) return null;
    const budget = await getBudgetItems(app.id);
    const files = await getUploadedFiles(app.id);
    return { application: app, budgetItems: budget, files };
  }),

  // Auto-save any part of the application
  save: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        // Part I
        legalBusinessName: z.string().optional(),
        dba: z.string().optional(),
        entityType: z
          .enum(["llc", "corporation", "sole_proprietorship", "nonprofit", "other"])
          .optional(),
        entityTypeOther: z.string().optional(),
        stateOfRegistration: z.string().optional(),
        dateOfFormation: z.string().optional(),
        businessAddress: z.string().optional(),
        repName: z.string().optional(),
        repTitle: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        businessDescription: z.string().optional(),
        // Part II
        certMember: z.boolean().optional(),
        certRegistered: z.boolean().optional(),
        certBankAccount: z.boolean().optional(),
        certNetProfit: z.boolean().optional(),
        certNoW2: z.boolean().optional(),
        certBusinessPlan: z.boolean().optional(),
        // Part III
        customerImpactNarrative: z.string().optional(),
        operatingHistory: z.string().optional(),
        founderNarrative: z.string().optional(),
        operationMode: z.enum(["full_time", "part_time"]).optional(),
        // Part IV
        ninetyDayImpact: z.string().optional(),
        budgetItems: z
          .array(
            z.object({
              description: z.string(),
              amount: z.number(),
              sortOrder: z.number(),
            })
          )
          .optional(),
        // Part VI
        certAccuracy: z.boolean().optional(),
        certAgreement: z.boolean().optional(),
        certConsent: z.boolean().optional(),
        certW9: z.boolean().optional(),
        signatureName: z.string().optional(),
        signatureDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (isDeadlinePassed()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The application deadline has passed.",
        });
      }
      const { applicationId, budgetItems: items, ...fields } = input;
      // Verify ownership
      const app = await getApplicationById(applicationId);
      if (!app || app.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (app.status === "submitted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Application already submitted" });
      }
      await updateApplication(applicationId, fields);
      if (items !== undefined) {
        await replaceBudgetItems(applicationId, items);
      }
      return { success: true };
    }),

  // Final submission
  submit: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (isDeadlinePassed()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The application deadline has passed.",
        });
      }
      const app = await getApplicationById(input.applicationId);
      if (!app || app.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (app.status === "submitted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already submitted" });
      }
      // Verify all Part II certs
      if (
        !app.certMember ||
        !app.certRegistered ||
        !app.certBankAccount ||
        !app.certNetProfit ||
        !app.certNoW2 ||
        !app.certBusinessPlan
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Eligibility certifications are not complete",
        });
      }
      // Verify Part VI certs
      if (!app.certAccuracy || !app.certAgreement || !app.certConsent || !app.certW9) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Part VI certifications are not complete",
        });
      }
      // Verify files
      const files = await getUploadedFiles(input.applicationId);
      const requiredTypes = ["formation_doc", "bank_account", "profit_loss", "business_plan"];
      const uploadedTypes = files.map((f) => f.fileType);
      const missing = requiredTypes.filter((t) => !uploadedTypes.includes(t as any));
      if (missing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Missing required documents: ${missing.join(", ")}`,
        });
      }

      await updateApplication(input.applicationId, {
        status: "submitted",
        submittedAt: new Date(),
      });

      // Notify owner
      try {
        await notifyOwner({
          title: "New Elevation Award Application Submitted",
          content: `${app.legalBusinessName || "A business"} (${app.repName || "Unknown"}) has submitted their application for the RISEhigHER Elevation Award.`,
        });
      } catch (_) {
        // Non-fatal
      }

      return { success: true };
    }),

  // Upload a document (base64 encoded)
  uploadFile: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        fileType: z.enum(["formation_doc", "bank_account", "profit_loss", "business_plan"]),
        fileName: z.string(),
        fileBase64: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (isDeadlinePassed()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The application deadline has passed.",
        });
      }
      const app = await getApplicationById(input.applicationId);
      if (!app || app.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (app.status === "submitted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Application already submitted" });
      }

      const buffer = Buffer.from(input.fileBase64, "base64");
      const key = `applications/${input.applicationId}/${input.fileType}/${Date.now()}-${input.fileName}`;
      const { key: storedKey, url } = await storagePut(key, buffer, "application/pdf");

      await upsertUploadedFile({
        applicationId: input.applicationId,
        fileType: input.fileType,
        originalName: input.fileName,
        storageKey: storedKey,
        storageUrl: url,
      });

      return { success: true, url };
    }),

  // Check deadline status
  deadlineStatus: publicProcedure.query(() => {
    return {
      deadline: DEADLINE_UTC.toISOString(),
      isPassed: isDeadlinePassed(),
    };
  }),
});

// ─── Admin router ─────────────────────────────────────────────────────────────
const adminRouter = router({
  // List all applications
  listApplications: adminProcedure.query(async () => {
    const rows = await getAllApplicationsForAdminAll();
    return rows.map((r) => ({ ...r, user: publicUser(r.user) }));
  }),

  // Get full application detail
  getApplication: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const app = await getApplicationById(input.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      const budget = await getBudgetItems(input.id);
      const files = await getUploadedFiles(input.id);
      return { application: app, budgetItems: budget, files };
    }),

  // Mark winner
  markWinner: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateApplication(input.id, { status: "winner" });
      return { success: true };
    }),

  // Unmark winner (back to submitted)
  unmarkWinner: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateApplication(input.id, { status: "submitted" });
      return { success: true };
    }),

  // Stats
  stats: adminProcedure.query(async () => {
    const all = await getAllApplicationsForAdminAll();
    const submitted = all.filter((r) => r.application.status === "submitted").length;
    const winners = all.filter((r) => r.application.status === "winner").length;
    const drafts = all.filter((r) => r.application.status === "draft").length;
    return { total: all.length, submitted, winners, drafts };
  }),

  // Evaluator invite management
  createInvite: adminProcedure
    .input(z.object({ email: z.string().email(), name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const token = nanoid(48);
      const invite = await createEvaluatorInvite({
        token,
        email: input.email,
        name: input.name,
      });
      return { invite, token };
    }),

  listInvites: adminProcedure.query(async () => {
    return getAllEvaluatorInvites();
  }),

  revokeInvite: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await revokeEvaluatorInvite(input.id);
      return { success: true };
    }),

  // Get scores for a specific application (for admin detail view)
  getApplicationScores: adminProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      return getScoresForApplication(input.applicationId);
    }),

  // Ranked leaderboard
  leaderboard: adminProcedure.query(async () => {
    const ranked = await getApplicationsRanked();
    return ranked.map((r) => ({ ...r, user: publicUser(r.user) }));
  }),
});

// ─── Evaluator router ─────────────────────────────────────────────────────────
// Evaluators authenticate via a magic-link token — no Manus OAuth required.
// The token is stored in a cookie (evaluator_session) for the duration of the session.
const EVALUATOR_COOKIE = "evaluator_session";

const evaluatorRouter = router({
  // Accept invite — sets evaluator session cookie
  acceptInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invite = await getEvaluatorInviteByToken(input.token);
      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite link" });
      if (invite.isRevoked) throw new TRPCError({ code: "FORBIDDEN", message: "This invite has been revoked" });

      // Mark accepted if first time
      if (!invite.acceptedAt) {
        await markInviteAccepted(input.token);
      }

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(EVALUATOR_COOKIE, invite.token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return { success: true, evaluatorName: invite.name };
    }),

  // Get current evaluator session info
  me: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[EVALUATOR_COOKIE];
    if (!token) return null;
    const invite = await getEvaluatorInviteByToken(token as string);
    if (!invite || invite.isRevoked) return null;
    return { id: invite.id, name: invite.name, email: invite.email };
  }),

  // Logout evaluator
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(EVALUATOR_COOKIE, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  // List all submitted applications (for evaluator to score)
  listApplications: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[EVALUATOR_COOKIE];
    if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
    const invite = await getEvaluatorInviteByToken(token as string);
    if (!invite || invite.isRevoked) throw new TRPCError({ code: "UNAUTHORIZED" });

    const apps = await getApplicationsRanked();
    // Attach this evaluator's existing score for each application
    const scores = await getScoresByInviteId(invite.id);
    return apps.map(({ application, user, averageScore, scoreCount }) => {
      const myScore = scores.find((s) => s.applicationId === application.id);
      return {
        application,
        user: { name: user.name },
        averageScore,
        scoreCount,
        myScore: myScore ?? null,
      };
    });
  }),

  // Get full application detail for evaluator (no documents, narratives only)
  getApplication: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const token = ctx.req.cookies?.[EVALUATOR_COOKIE];
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
      const invite = await getEvaluatorInviteByToken(token as string);
      if (!invite || invite.isRevoked) throw new TRPCError({ code: "UNAUTHORIZED" });

      const app = await getApplicationById(input.id);
      if (!app || app.status === "draft") throw new TRPCError({ code: "NOT_FOUND" });
      const budget = await getBudgetItems(input.id);
      const myScore = await getScoreByInviteAndApplication(invite.id, input.id);
      return { application: app, budgetItems: budget, myScore: myScore ?? null, inviteId: invite.id };
    }),

  // Submit or update a score
  submitScore: publicProcedure
    .input(
      z.object({
        applicationId: z.number(),
        scoreCustomerImpact: z.number().min(0).max(25),
        scoreOperatingHistory: z.number().min(0).max(20),
        scoreFounderNarrative: z.number().min(0).max(20),
        scoreFundUse: z.number().min(0).max(20),
        scoreNinetyDayImpact: z.number().min(0).max(15),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = ctx.req.cookies?.[EVALUATOR_COOKIE];
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
      const invite = await getEvaluatorInviteByToken(token as string);
      if (!invite || invite.isRevoked) throw new TRPCError({ code: "UNAUTHORIZED" });

      const app = await getApplicationById(input.applicationId);
      if (!app || app.status === "draft") throw new TRPCError({ code: "NOT_FOUND" });

      await upsertEvaluatorScore({
        inviteId: invite.id,
        applicationId: input.applicationId,
        scoreCustomerImpact: input.scoreCustomerImpact,
        scoreOperatingHistory: input.scoreOperatingHistory,
        scoreFounderNarrative: input.scoreFounderNarrative,
        scoreFundUse: input.scoreFundUse,
        scoreNinetyDayImpact: input.scoreNinetyDayImpact,
        notes: input.notes,
      });

      return { success: true };
    }),
});

// ─── App router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => (opts.ctx.user ? publicUser(opts.ctx.user) : null)),

    // Register a new applicant account (email + password) and sign in.
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(8, "Password must be at least 8 characters"),
          name: z.string().min(1).max(200),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const existing = await getUserByEmail(email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists. Please sign in.",
          });
        }
        const passwordHash = await hashPassword(input.password);
        const user = await createUser({
          openId: `local:${nanoid(16)}`,
          email,
          name: input.name.trim(),
          passwordHash,
          role: "user",
        });
        const token = await signSession(user.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true } as const;
      }),

    // Sign in with email + password.
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const user = await getUserByEmail(email);
        const ok = user && (await verifyPassword(input.password, user.passwordHash));
        if (!user || !ok) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Incorrect email or password.",
          });
        }
        await touchUserSignIn(user.id);
        const token = await signSession(user.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, role: user.role } as const;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  application: applicationRouter,
  admin: adminRouter,
  evaluator: evaluatorRouter,
  settings: router({
    // Public: anyone can read the announcement banner state
    getAnnouncement: publicProcedure.query(async () => {
      const s = await getSiteSettings();
      return {
        enabled: s?.announcementEnabled ?? false,
        businessName: s?.announcementBusinessName ?? null,
        message: s?.announcementMessage ?? null,
      };
    }),
    // Admin-only: toggle the announcement banner
    updateAnnouncement: adminProcedure
      .input(z.object({
        enabled: z.boolean(),
        businessName: z.string().max(200).optional(),
        message: z.string().max(500).optional(),
      }))
      .mutation(async ({ input }) => {
        await updateSiteSettings({
          announcementEnabled: input.enabled,
          announcementBusinessName: input.businessName ?? null,
          announcementMessage: input.message ?? null,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
