import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient, UserRole, UserStatus } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL 未配置");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "guo";
  const password = process.env.ADMIN_PASSWORD ?? "123456";
  const email = process.env.ADMIN_EMAIL ?? "guo@local.invalid";

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existing) {
    console.log(`管理员账号 ${username} 已存在`);
    return;
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      id,
      name: "管理员",
      email,
      emailVerified: true,
      username,
      displayUsername: username,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });

  console.log(`管理员账号已创建：${username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
