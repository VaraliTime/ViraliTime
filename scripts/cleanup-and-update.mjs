import { drizzle } from "drizzle-orm/mysql2";
import { ebooks } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

// Initialize database
const db = drizzle(process.env.DATABASE_URL);

async function cleanupAndUpdate() {
  console.log("🚀 Starting cleanup and update...");

  try {
    // Find and delete test ebooks (any ebook that doesn't match our two main ones)
    console.log("🗑️  Searching for test ebooks to delete...");

    const allEbooks = await db.select().from(ebooks);
    console.log(`📊 Found ${allEbooks.length} ebook(s)`);

    // Define our legitimate ebooks
    const legitimateSlugs = [
      "lexistence-de-lintelligence-artificielle",
      "le-codage-enfin-explique-simplement",
    ];

    // Find test ebooks
    const testEbooks = allEbooks.filter(
      (ebook) => !legitimateSlugs.includes(ebook.slug)
    );

    if (testEbooks.length > 0) {
      console.log(`\n🗑️  Found ${testEbooks.length} test ebook(s) to delete:`);
      for (const ebook of testEbooks) {
        console.log(`   - ${ebook.title} (ID: ${ebook.id})`);
        await db.delete(ebooks).where(eq(ebooks.id, ebook.id));
        console.log(`   ✅ Deleted`);
      }
    } else {
      console.log("✅ No test ebooks found");
    }

    console.log("\n✨ Cleanup completed successfully!");
    console.log("📊 Remaining ebooks:");
    const remainingEbooks = await db.select().from(ebooks);
    for (const ebook of remainingEbooks) {
      console.log(`   - ${ebook.title} (€${ebook.price})`);
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupAndUpdate();
