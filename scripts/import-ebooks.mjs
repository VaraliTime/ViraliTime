import { drizzle } from "drizzle-orm/mysql2";
import { categories, ebooks } from "../drizzle/schema.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
const db = drizzle(process.env.DATABASE_URL);

async function importEbooks() {
  console.log("🚀 Starting ebook import...");

  try {
    // Create default category if it doesn't exist
    const defaultCategory = await db
      .select()
      .from(categories)
      .where((c) => c.name === "Technologie")
      .limit(1);

    let categoryId = defaultCategory[0]?.id;

    if (!categoryId) {
      console.log("📁 Creating default category 'Technologie'...");
      const result = await db.insert(categories).values({
        name: "Technologie",
        slug: "technologie",
      });
      categoryId = result[0];
    }

    // Ebook 1: L'existence de l'intelligence artificielle
    console.log("📚 Importing: L'existence de l'intelligence artificielle");

    const pdfPath = path.join(
      __dirname,
      "../uploads/LIntelligence-Artificielle-Existe-t-elle.pdf"
    );

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ File not found: ${pdfPath}`);
      return;
    }

    // Note: PDF upload to S3 will be done manually via the admin panel
    console.log("📝 Note: Upload the PDF file via the admin panel");

    // Insert ebook into database
    const ebook1 = await db.insert(ebooks).values({
      title: "L'existence de l'intelligence artificielle",
      slug: "lexistence-de-lintelligence-artificielle",
      author: "ViraliTime",
      description:
        "Une exploration profonde sur l'existence et la nature de l'intelligence artificielle. Découvrez les concepts fondamentaux, les applications actuelles et les enjeux futurs de l'IA.",
      price: 5.00,
      categoryId: categoryId,
      isFeatured: true,
      coverImageUrl:
        "https://images.unsplash.com/photo-1677442d019cecf8d5a32b1e49b1055e?w=400&h=600&fit=crop",
    });

    console.log("✅ Ebook 1 imported successfully!");

    // Ebook 2: Le codage enfin expliqué simplement
    console.log("📚 Importing: Le codage enfin expliqué simplement");

    const ebook2 = await db.insert(ebooks).values({
      title: "Le codage enfin expliqué simplement",
      slug: "le-codage-enfin-explique-simplement",
      author: "ViraliTime",
      description:
        "Un guide complet pour comprendre les bases du codage et de la programmation. Parfait pour les débutants qui souhaitent apprendre à coder sans complexité.",
      price: 2.00,
      categoryId: categoryId,
      isFeatured: true,
      coverImageUrl:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=600&fit=crop",
    });

    console.log("✅ Ebook 2 imported successfully!");

    console.log("\n✨ All ebooks imported successfully!");
    console.log("📊 Summary:");
    console.log("  - L'existence de l'intelligence artificielle: €5.00");
    console.log("  - Le codage enfin expliqué simplement: €2.00");
  } catch (error) {
    console.error("❌ Error importing ebooks:", error);
    process.exit(1);
  }
}

importEbooks();
