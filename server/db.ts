import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, ebooks, purchases, cartItems, siteConfig, InsertCategory, InsertEbook, InsertPurchase, InsertCartItem, InsertSiteConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "stripeCustomerId"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Categories
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(category);
  return result;
}

export async function updateCategory(id: number, category: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(category).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// Ebooks
export async function getAllEbooks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ebooks).orderBy(desc(ebooks.createdAt));
}

export async function getEbookById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ebooks).where(eq(ebooks.id, id)).limit(1);
  return result[0];
}

export async function getEbookBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ebooks).where(eq(ebooks.slug, slug)).limit(1);
  return result[0];
}

export async function getFeaturedEbooks(limit: number = 6) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ebooks).where(eq(ebooks.isFeatured, true)).limit(limit);
}

export async function getRecentEbooks(limit: number = 6) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ebooks).orderBy(desc(ebooks.createdAt)).limit(limit);
}

export async function searchEbooks(params: {
  query?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  author?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];

  if (params.query) {
    conditions.push(
      or(
        like(ebooks.title, `%${params.query}%`),
        like(ebooks.author, `%${params.query}%`),
        like(ebooks.description, `%${params.query}%`)
      )
    );
  }

  if (params.categoryId) {
    conditions.push(eq(ebooks.categoryId, params.categoryId));
  }

  if (params.author) {
    conditions.push(like(ebooks.author, `%${params.author}%`));
  }

  if (params.minPrice !== undefined) {
    conditions.push(sql`${ebooks.price} >= ${params.minPrice}`);
  }

  if (params.maxPrice !== undefined) {
    conditions.push(sql`${ebooks.price} <= ${params.maxPrice}`);
  }

  if (conditions.length === 0) {
    return db.select().from(ebooks).orderBy(desc(ebooks.createdAt));
  }

  return db.select().from(ebooks).where(and(...conditions)).orderBy(desc(ebooks.createdAt));
}

export async function createEbook(ebook: InsertEbook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ebooks).values(ebook);
  return result;
}

export async function updateEbook(id: number, ebook: Partial<InsertEbook>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ebooks).set(ebook).where(eq(ebooks.id, id));
}

export async function deleteEbook(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ebooks).where(eq(ebooks.id, id));
}

// Cart
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const items = await db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      ebookId: cartItems.ebookId,
      addedAt: cartItems.addedAt,
      ebook: ebooks,
    })
    .from(cartItems)
    .leftJoin(ebooks, eq(cartItems.ebookId, ebooks.id))
    .where(eq(cartItems.userId, userId));

  return items;
}

export async function addToCart(userId: number, ebookId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.ebookId, ebookId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(cartItems).values({ userId, ebookId });
  return result;
}

export async function removeFromCart(userId: number, ebookId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.ebookId, ebookId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// Purchases
export async function getUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const userPurchases = await db
    .select({
      id: purchases.id,
      userId: purchases.userId,
      ebookId: purchases.ebookId,
      stripePaymentIntentId: purchases.stripePaymentIntentId,
      stripeCheckoutSessionId: purchases.stripeCheckoutSessionId,
      amount: purchases.amount,
      purchasedAt: purchases.purchasedAt,
      ebook: ebooks,
    })
    .from(purchases)
    .leftJoin(ebooks, eq(purchases.ebookId, ebooks.id))
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.purchasedAt));

  return userPurchases;
}

export async function createPurchase(purchase: InsertPurchase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchases).values(purchase);
  return result;
}

export async function hasPurchased(userId: number, ebookId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.ebookId, ebookId)))
    .limit(1);

  return result.length > 0;
}

export async function getPurchasedEbookIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({ ebookId: purchases.ebookId })
    .from(purchases)
    .where(eq(purchases.userId, userId));

  return result.map(p => p.ebookId);
}

// Site Configuration
export async function getSiteConfig() {
  const db = await getDb();
  if (!db) return { siteName: "ViraliTime", siteDescription: "" };
  
  const result = await db.select().from(siteConfig).limit(1);
  
  if (result.length === 0) {
    // Create default config if it doesn't exist
    await db.insert(siteConfig).values({
      siteName: "ViraliTime",
      siteDescription: "Plateforme de vente d'ebooks",
    });
    return { siteName: "ViraliTime", siteDescription: "Plateforme de vente d'ebooks" };
  }
  
  return result[0];
}

export async function updateSiteConfig(config: Partial<InsertSiteConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(siteConfig).limit(1);
  
  if (existing.length === 0) {
    await db.insert(siteConfig).values({
      siteName: config.siteName || "ViraliTime",
      siteDescription: config.siteDescription,
    });
  } else {
    await db.update(siteConfig).set(config).where(eq(siteConfig.id, existing[0].id));
  }
}
