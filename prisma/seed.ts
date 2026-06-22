/**
 * Seed the app-owned `ai_tools` table with the six fixed tools (§4.2).
 * Standalone (run via `npm run db:seed`) — needs DATABASE_URL. Does NOT touch
 * the existing read-only content tables.
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const TOOLS = [
  { toolKey: "image_generation", name: "AI Image Generation", description: "Turn a prompt into a stunning image.", requiresPro: 0 },
  { toolKey: "image_enhancer", name: "AI Image Enhancer", description: "Upscale and sharpen up to 4×.", requiresPro: 0 },
  { toolKey: "bg_remover", name: "BG Remover", description: "Cut out the subject in one tap.", requiresPro: 0 },
  { toolKey: "bg_changer", name: "BG Changer", description: "Drop your subject into any scene from a prompt.", requiresPro: 1 },
  { toolKey: "retouch", name: "AI Retouch", description: "Flawless, natural touch-ups.", requiresPro: 1 },
  { toolKey: "old_to_new", name: "AI Old to New", description: "Restore old photos to crisp, modern shots.", requiresPro: 1 },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set — nothing to seed.");
    process.exit(1);
  }
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
  const coinCost = Number.parseInt(process.env.COIN_COST_TOOL ?? "3", 10) || 3;

  for (let i = 0; i < TOOLS.length; i++) {
    const t = TOOLS[i];
    await prisma.aiTool.upsert({
      where: { toolKey: t.toolKey },
      update: {
        name: t.name,
        description: t.description,
        requiresPro: t.requiresPro,
        sortOrder: i,
        status: 1,
      },
      create: {
        toolKey: t.toolKey,
        name: t.name,
        description: t.description,
        requiresPro: t.requiresPro,
        coinCost,
        sortOrder: i,
        status: 1,
      },
    });
  }

  console.log(`Seeded ${TOOLS.length} AI tools.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
