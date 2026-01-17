import { drizzle } from "drizzle-orm/mysql2";
import { ebooks } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

// Initialize database
const db = drizzle(process.env.DATABASE_URL);

async function updateEbookPDF() {
  console.log("🚀 Updating ebook with PDF files...");

  try {
    // Update "Le codage enfin expliqué simplement" with PDF
    console.log("📚 Updating: Le codage enfin expliqué simplement");

    const result = await db
      .update(ebooks)
      .set({
        pdfFileKey: "ebooks/le-codage-enfin-explique-simplement.pdf",
      })
      .where(eq(ebooks.slug, "le-codage-enfin-explique-simplement"));

    console.log("✅ Ebook updated successfully!");
    console.log("📊 Summary:");
    console.log("  - Le codage enfin expliqué simplement: PDF added");

    // Update "L'existence de l'intelligence artificielle" with PDF
    console.log("\n📚 Updating: L'existence de l'intelligence artificielle");

    const result2 = await db
      .update(ebooks)
      .set({
        pdfFileKey: "ebooks/lexistence-de-lintelligence-artificielle.pdf",
      })
      .where(eq(ebooks.slug, "lexistence-de-lintelligence-artificielle"));

    console.log("✅ Ebook updated successfully!");
    console.log("📊 Summary:");
    console.log("  - L'existence de l'intelligence artificielle: PDF added");

    console.log("\n✨ All ebooks updated successfully!");
  } catch (error) {
    console.error("❌ Error updating ebooks:", error);
    process.exit(1);
  }
}

updateEbookPDF();
