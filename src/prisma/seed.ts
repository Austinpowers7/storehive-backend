import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: "walk-in-customer-id" },
    update: {},
    create: {
      id: "walk-in-customer-id",
      email: "walkin@store.com",
      password: "not_applicable", // Or leave blank if allowed
      role: "CUSTOMER",
      deletedAt: new Date(), // Mark as logically deleted to avoid UI noise
    },
  });

  console.log("✅ Seeded: walk-in customer");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
