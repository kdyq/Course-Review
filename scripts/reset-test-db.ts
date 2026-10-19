import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
    throw new Error("DATABASE_URL_TEST 未配置");
  }

  console.log("应用测试数据库迁移...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });

  const adapter = new PrismaPg({ connectionString: testUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "AuditLog", "Notification", "Bookmark", "InstructorResponse", "Report",
        "ReviewTag", "Tag", "ReviewVote", "ReviewAuthor", "Review",
        "OfferingInstructor", "Offering", "Term", "Instructor", "Course", "College",
        "verification", "account", "session", "user"
      CASCADE
    `);
    console.log("测试数据库已清空");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
