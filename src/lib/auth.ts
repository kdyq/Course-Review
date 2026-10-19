import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, username } from "better-auth/plugins";
import { sendVerificationOtp } from "./mail";
import { prisma } from "./prisma";

export const auth = betterAuth({
  appName: "课评手账",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 64,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: false,
        returned: true,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
        returned: true,
      },
    },
  },
  plugins: [
    username({
      // 管理员 guo 是直接种子的 3 位账号；普通用户至少 5 位的规则在注册表单和服务端校验。
      minUsernameLength: 3,
      maxUsernameLength: 32,
      usernameValidator: (value) => {
        const adminUsername = (process.env.ADMIN_USERNAME ?? "guo").toLowerCase();
        const normalized = value.toLowerCase();
        return /^[A-Za-z0-9]+$/.test(value) && (value.length >= 5 || normalized === adminUsername);
      },
    }),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendVerificationOtp({ email, otp, type });
      },
      sendVerificationOnSignUp: process.env.EMAIL_VERIFICATION_ENABLED === "true",
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 300,
      storeOTP: "hashed",
    }),
    nextCookies(),
  ],
});
