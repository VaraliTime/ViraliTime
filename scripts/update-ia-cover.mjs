import { drizzle } from "drizzle-orm/mysql2";
import { ebooks } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

// Initialize database
const db = drizzle(process.env.DATABASE_URL);

async function updateIACover() {
  console.log("🚀 Updating IA ebook cover...");

  try {
    // Update the IA ebook with the new cover image
    console.log("📚 Updating: L'existence de l'intelligence artificielle");

    const result = await db
      .update(ebooks)
      .set({
        coverImageUrl:
          "https://images.unsplash.com/photo-1677442d019cecf8d5a32b1e49b1055e?w=400&h=600&fit=crop",
        coverImageKey: "ebooks/ia-cover.webp",
      })
      .where(eq(ebooks.slug, "lexistence-de-lintelligence-artificielle"));

    console.log("✅ Cover updated successfully!");
    console.log("📊 Summary:");
    console.log("  - L'existence de l'intelligence artificielle: Cover updated");

    console.log("\n✨ All updates completed successfully!");
  } catch (error) {
    console.error("❌ Error updating cover:", error);
    process.exit(1);
  }
}

updateIACover();
