import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: 'user' | 'admin' = 'user'): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("ebooks router", () => {
  it("allows public access to list ebooks", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ebooks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows public access to featured ebooks", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ebooks.featured({ limit: 6 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows public access to recent ebooks", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ebooks.recent({ limit: 6 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows public access to search ebooks", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ebooks.search({ query: "test" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("categories router", () => {
  it("allows public access to list categories", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("cart router", () => {
  it("requires authentication to access cart", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.cart.get()).rejects.toThrow();
  });

  it("allows authenticated users to access their cart", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.get();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("purchases router", () => {
  it("requires authentication to list purchases", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.purchases.list()).rejects.toThrow();
  });

  it("allows authenticated users to list their purchases", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.purchases.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin procedures", () => {
  it("prevents non-admin users from creating ebooks", async () => {
    const { ctx } = createAuthContext('user');
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ebooks.create({
        title: "Test Ebook",
        slug: "test-ebook",
        author: "Test Author",
        description: "Test description",
        price: "9.99",
      })
    ).rejects.toThrow("Admin access required");
  });

  it("allows admin users to create ebooks", async () => {
    const { ctx } = createAuthContext('admin');
    const caller = appRouter.createCaller(ctx);

    // This test will succeed if admin has proper permissions
    // In a real scenario, you'd mock the database
    const result = await caller.ebooks.create({
      title: "Test Ebook",
      slug: "test-ebook-" + Date.now(),
      author: "Test Author",
      description: "Test description",
      price: "9.99",
    });

    expect(result).toHaveProperty("success", true);
  });
});
