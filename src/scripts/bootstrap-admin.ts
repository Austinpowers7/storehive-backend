import bcrypt from "bcrypt";
import prisma from "@src/lib/prisma";
import "dotenv/config";

async function bootstrapAdmin() {
  try {
    const adminEmail = process.env.INIT_ADMIN_EMAIL;
    const adminPassword = process.env.INIT_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error(
        "Please set INIT_ADMIN_EMAIL and INIT_ADMIN_PASSWORD in your environment."
      );
      process.exit(1);
    }

    // Check if an admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      console.log(
        `Admin user already exists with email: ${existingAdmin.email}. Skipping creation.`
      );
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log(`Successfully created initial admin: ${adminUser.email}`);
    process.exit(0);
  } catch (error) {
    console.error("Error bootstrapping admin user:", error);
    process.exit(1);
  }
}

bootstrapAdmin();

// To run this script, use the command: ts-node scr/scripts/bootstrap-admin.ts or npx ts-node -r tsconfig-paths/register src/scripts/bootstrap-admin.ts
