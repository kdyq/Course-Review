import nodemailer, { type Transporter } from "nodemailer";

type OtpType = "sign-in" | "email-verification" | "forget-password" | "change-email";

const TYPE_LABELS: Record<OtpType, string> = {
  "sign-in": "登录",
  "email-verification": "邮箱验证",
  "forget-password": "重置密码",
  "change-email": "更换邮箱",
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.QQ_SMTP_HOST;
  const user = process.env.QQ_SMTP_USER;
  const pass = process.env.QQ_SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("QQ SMTP 配置不完整");
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.QQ_SMTP_PORT ?? "465"),
    secure: process.env.QQ_SMTP_SECURE !== "false",
    auth: { user, pass },
  });

  return transporter;
}

export async function sendVerificationOtp({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: OtpType;
}): Promise<void> {
  const mode = process.env.EMAIL_DELIVERY_MODE ?? "log";
  const label = TYPE_LABELS[type];

  if (mode !== "smtp") {
    console.info(`[email:log] ${label}验证码 ${otp} -> ${email}`);
    return;
  }

  const from = process.env.EMAIL_FROM ?? process.env.QQ_SMTP_USER;
  if (!from) {
    throw new Error("EMAIL_FROM 未配置");
  }

  await getTransporter().sendMail({
    from: `"课评手账" <${from}>`,
    to: email,
    subject: `课评手账 ${label}验证码`,
    text: [
      `你的验证码是 ${otp}，5 分钟内有效。`,
      "",
      `用途：${label}`,
      "如果不是你本人操作，请忽略这封邮件。",
    ].join("\n"),
    html: [
      `<p>你的验证码是 <strong>${otp}</strong>，5 分钟内有效。</p>`,
      `<p>用途：${label}</p>`,
      "<p>如果不是你本人操作，请忽略这封邮件。</p>",
    ].join(""),
  });
}
