import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { ebooks } from "../drizzle/schema.js";
import * as fs from "fs";
import * as path from "path";

const db = drizzle(process.env.DATABASE_URL);

async function updateCovers() {
  console.log("🖼️  Updating ebook covers...");

  try {
    // Upload IA cover to S3
    const iaCoverPath = path.join(process.cwd(), "uploads/ia-cover.webp");
    const iaCoverBuffer = fs.readFileSync(iaCoverPath);
    
    // For now, we'll use a placeholder URL - in production you'd upload to S3
    const iaCoverUrl = "/covers/ia-cover.webp";

    // Update "L'existence de l'intelligence artificielle" with the new cover
    await db
      .update(ebooks)
      .set({
        coverImageUrl: iaCoverUrl,
      })
      .where(eq(ebooks.title, "L'existence de l'intelligence artificielle"));

    console.log("✅ IA ebook cover updated");

    // Get all ebooks to verify
    const allEbooks = await db.select().from(ebooks);
    console.log("\n📚 Current ebooks:");
    allEbooks.forEach((ebook) => {
      console.log(`  - ${ebook.title}`);
      console.log(`    Cover: ${ebook.coverImageUrl || "No cover"}`);
    });

    console.log("\n✨ All covers updated successfully!");
  } catch (error) {
    console.error("❌ Error updating covers:", error);
    process.exit(1);
  }
}

updateCovers();
