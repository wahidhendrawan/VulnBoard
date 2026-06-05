/**
 * Seed the database with initial finding templates and a demo user.
 * Run: npx ts-node src/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { findingTemplatesData } from "./data/findingTemplates";

const db = new PrismaClient();

async function main() {
  // Upsert demo user
  const hash = await bcrypt.hash("demo1234", 12);
  const user = await db.user.upsert({
    where: { email: "demo@vulnboard.local" },
    update: {},
    create: { email: "demo@vulnboard.local", password: hash, name: "Demo User", company: "VulnBoard" },
  });
  console.log(`[seed] user: ${user.email}`);

  // Seed EN templates
  for (const ft of findingTemplatesData) {
    await db.findingTemplate.upsert({
      where: { id: ft.id },
      update: {},
      create: {
        id: ft.id,
        title: ft.title,
        severity: ft.severity,
        controlId: ft.controlId,
        description: ft.description,
        impact: ft.impact,
        recommendation: ft.recommendation,
        category: ft.category,
        language: "en",
      },
    });
    // ID template with _id suffix
    await db.findingTemplate.upsert({
      where: { id: `${ft.id}_id` },
      update: {},
      create: {
        id: `${ft.id}_id`,
        title: ft.title_id,
        severity: ft.severity,
        controlId: ft.controlId,
        description: ft.description_id,
        impact: ft.impact_id,
        recommendation: ft.recommendation_id,
        category: ft.category,
        language: "id",
      },
    });
  }
  console.log(`[seed] ${findingTemplatesData.length * 2} finding templates seeded`);
}

main().catch(console.error).finally(() => db.$disconnect());
