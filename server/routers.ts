import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { createCheckoutSession } from "./stripe";
import { getSecureDownloadUrl } from "./download";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createCategory(input);
        return { success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),
  }),

  ebooks: router({
    list: publicProcedure.query(async () => {
      return await db.getAllEbooks();
    }),
    
    featured: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getFeaturedEbooks(input?.limit);
      }),
    
    recent: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getRecentEbooks(input?.limit);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const ebook = await db.getEbookById(input.id);
        if (!ebook) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ebook not found' });
        }
        return ebook;
      }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const ebook = await db.getEbookBySlug(input.slug);
        if (!ebook) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ebook not found' });
        }
        return ebook;
      }),
    
    search: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        categoryId: z.number().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        author: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchEbooks(input);
      }),
    
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        author: z.string().min(1),
        description: z.string().min(1),
        price: z.string(),
        coverImageUrl: z.string().optional(),
        coverImageKey: z.string().optional(),
        pdfFileUrl: z.string().optional(),
        pdfFileKey: z.string().optional(),
        epubFileUrl: z.string().optional(),
        epubFileKey: z.string().optional(),
        categoryId: z.number().optional(),
        isFeatured: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createEbook(input);
        return { success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        author: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        coverImageUrl: z.string().optional(),
        coverImageKey: z.string().optional(),
        pdfFileUrl: z.string().optional(),
        pdfFileKey: z.string().optional(),
        epubFileUrl: z.string().optional(),
        epubFileKey: z.string().optional(),
        categoryId: z.number().optional(),
        isFeatured: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEbook(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEbook(input.id);
        return { success: true };
      }),
  }),

  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCartItems(ctx.user.id);
    }),
    
    add: protectedProcedure
      .input(z.object({ ebookId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.addToCart(ctx.user.id, input.ebookId);
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ ebookId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromCart(ctx.user.id, input.ebookId);
        return { success: true };
      }),
    
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  purchases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPurchases(ctx.user.id);
    }),
    
    hasPurchased: protectedProcedure
      .input(z.object({ ebookId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.hasPurchased(ctx.user.id, input.ebookId);
      }),
    
    getPurchasedIds: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPurchasedEbookIds(ctx.user.id);
    }),
  }),

  payment: router({
    createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
      const cartItems = await db.getCartItems(ctx.user.id);
      
      if (cartItems.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
      }

      const ebookIds = cartItems.map(item => item.ebookId);
      const ebookTitles = cartItems.map(item => item.ebook?.title || 'Ebook');
      const amounts = cartItems.map(item => parseFloat(item.ebook?.price || '0'));

      const session = await createCheckoutSession({
        ebookIds,
        ebookTitles,
        amounts,
        userId: ctx.user.id,
        userEmail: ctx.user.email || '',
        userName: ctx.user.name || '',
        origin: ctx.req.headers.origin || 'http://localhost:3000',
      });

      return { url: session.url };
    }),
  }),

  download: router({
    getDownloadUrl: protectedProcedure
      .input(z.object({ 
        ebookId: z.number(),
        format: z.enum(['pdf', 'epub'])
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user has purchased this ebook
        const hasPurchased = await db.hasPurchased(ctx.user.id, input.ebookId);
        if (!hasPurchased) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'You must purchase this ebook before downloading' 
          });
        }

        // Get ebook details
        const ebook = await db.getEbookById(input.ebookId);
        if (!ebook) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ebook not found' });
        }

        // Get the appropriate file key
        const fileKey = input.format === 'pdf' ? ebook.pdfFileKey : ebook.epubFileKey;
        if (!fileKey) {
          throw new TRPCError({ 
            code: 'NOT_FOUND', 
            message: `${input.format.toUpperCase()} format not available for this ebook` 
          });
        }

        // Generate secure download URL
        const downloadUrl = await getSecureDownloadUrl(fileKey);
        return { url: downloadUrl, filename: `${ebook.slug}.${input.format}` };
      }),
  }),

  config: router({
    getSiteConfig: publicProcedure.query(async () => {
      return await db.getSiteConfig();
    }),
    
    updateSiteConfig: adminProcedure
      .input(z.object({
        siteName: z.string().min(1).optional(),
        siteDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateSiteConfig(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
