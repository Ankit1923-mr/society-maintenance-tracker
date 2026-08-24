import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@society.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@society.com",
      password: hashedPassword,
      role: "ADMIN",
      flatNumber: "A-001",
    },
  });

  console.log("Seeded admin user:", {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    password: "admin123 (plaintext)",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
