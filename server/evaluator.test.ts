import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createEvaluatorInvite: vi.fn().mockResolvedValue({
      id: 1,
      token: "test-token-abc123",
      email: "evaluator@example.com",
      name: "Jane Evaluator",
      isRevoked: false,
      acceptedAt: null,
      createdAt: new Date(),
    }),
    getEvaluatorInviteByToken: vi.fn().mockImplementation(async (token: string) => {
      if (token === "valid-token") {
        return {
          id: 1,
          token: "valid-token",
          email: "evaluator@example.com",
          name: "Jane Evaluator",
          isRevoked: false,
          acceptedAt: null,
          createdAt: new Date(),
        };
      }
      if (token === "revoked-token") {
        return {
          id: 2,
          token: "revoked-token",
          email: "revoked@example.com",
          name: "Revoked User",
          isRevoked: true,
          acceptedAt: null,
          createdAt: new Date(),
        };
      }
      return undefined;
    }),
    getAllEvaluatorInvites: vi.fn().mockResolvedValue([]),
    markInviteAccepted: vi.fn().mockResolvedValue(undefined),
    revokeEvaluatorInvite: vi.fn().mockResolvedValue(undefined),
    upsertEvaluatorScore: vi.fn().mockResolvedValue(undefined),
    getScoresForApplication: vi.fn().mockResolvedValue([]),
    getScoreByInviteAndApplication: vi.fn().mockResolvedValue(null),
    getScoresByInviteId: vi.fn().mockResolvedValue([]),
    getApplicationsRanked: vi.fn().mockResolvedValue([]),
    getApplicationById: vi.fn().mockImplementation(async (id: number) => {
      if (id === 99) return { id: 99, status: "submitted", userId: 10 };
      if (id === 88) return { id: 88, status: "draft", userId: 10 };
      return undefined;
    }),
    getBudgetItems: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

// ─── Context factories ────────────────────────────────────────────────────────

function makeAdminCtx(): TrpcContext {
  const cookies: Record<string, string> = {};
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
      cookies,
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function makeEvaluatorCtx(token?: string): TrpcContext {
  const cookies: Record<string, string> = {};
  if (token) cookies["evaluator_session"] = token;
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies,
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("admin.createInvite", () => {
  it("creates an invite and returns token", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.createInvite({
      name: "Jane Evaluator",
      email: "evaluator@example.com",
    });
    expect(result.invite.name).toBe("Jane Evaluator");
    expect(result.token).toBeTruthy();
    expect(result.token.length).toBeGreaterThan(10);
  });

  it("rejects non-admin users", async () => {
    const ctx = makeAdminCtx();
    ctx.user!.role = "user";
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.createInvite({ name: "X", email: "x@x.com" })
    ).rejects.toThrow();
  });
});

describe("admin.revokeInvite", () => {
  it("revokes an invite", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.revokeInvite({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("evaluator.acceptInvite", () => {
  it("accepts a valid invite and sets cookie", async () => {
    const ctx = makeEvaluatorCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluator.acceptInvite({ token: "valid-token" });
    expect(result.success).toBe(true);
    expect(result.evaluatorName).toBe("Jane Evaluator");
    expect((ctx.res.cookie as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("rejects a revoked invite", async () => {
    const ctx = makeEvaluatorCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.evaluator.acceptInvite({ token: "revoked-token" })
    ).rejects.toThrow("revoked");
  });

  it("rejects an invalid token", async () => {
    const ctx = makeEvaluatorCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.evaluator.acceptInvite({ token: "nonexistent-token" })
    ).rejects.toThrow();
  });
});

describe("evaluator.me", () => {
  it("returns evaluator info when session cookie is valid", async () => {
    const ctx = makeEvaluatorCtx("valid-token");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluator.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Jane Evaluator");
  });

  it("returns null when no cookie", async () => {
    const ctx = makeEvaluatorCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluator.me();
    expect(result).toBeNull();
  });

  it("returns null when cookie is revoked", async () => {
    const ctx = makeEvaluatorCtx("revoked-token");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluator.me();
    expect(result).toBeNull();
  });
});

describe("evaluator.submitScore", () => {
  it("saves a valid score for a submitted application", async () => {
    const ctx = makeEvaluatorCtx("valid-token");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluator.submitScore({
      applicationId: 99,
      scoreCustomerImpact: 20,
      scoreOperatingHistory: 15,
      scoreFounderNarrative: 18,
      scoreFundUse: 17,
      scoreNinetyDayImpact: 12,
      notes: "Strong application.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects scores exceeding category max", async () => {
    const ctx = makeEvaluatorCtx("valid-token");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.evaluator.submitScore({
        applicationId: 99,
        scoreCustomerImpact: 30, // max is 25
        scoreOperatingHistory: 15,
        scoreFounderNarrative: 18,
        scoreFundUse: 17,
        scoreNinetyDayImpact: 12,
      })
    ).rejects.toThrow();
  });

  it("rejects scoring a draft application", async () => {
    const ctx = makeEvaluatorCtx("valid-token");
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.evaluator.submitScore({
        applicationId: 88, // draft
        scoreCustomerImpact: 20,
        scoreOperatingHistory: 15,
        scoreFounderNarrative: 18,
        scoreFundUse: 17,
        scoreNinetyDayImpact: 12,
      })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated evaluators", async () => {
    const ctx = makeEvaluatorCtx(); // no cookie
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.evaluator.submitScore({
        applicationId: 99,
        scoreCustomerImpact: 20,
        scoreOperatingHistory: 15,
        scoreFounderNarrative: 18,
        scoreFundUse: 17,
        scoreNinetyDayImpact: 12,
      })
    ).rejects.toThrow();
  });
});

describe("evaluator.logout", () => {
  it("clears the evaluator session cookie", async () => {
    const ctx = makeEvaluatorCtx("valid-token");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluator.logout();
    expect(result.success).toBe(true);
    expect((ctx.res.clearCookie as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});
