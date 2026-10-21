import { expect, type Page, test } from "@playwright/test";

async function waitForHydration(page: Page) {
  await page.waitForSelector(".user-menu-loading", {
    state: "detached",
    timeout: 30000,
  });
}

async function loginAdmin(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await waitForHydration(page);
  await page.fill("#login-username", "guo");
  await page.fill("#login-password", "123456");
  await page.click('.auth-card form button[type="submit"]');
  await page.waitForURL("**/", { timeout: 30000 });
}

async function writePagePath(page: Page): Promise<string> {
  await page.goto("/courses?q=操作系统", { waitUntil: "networkidle" });
  await page.waitForSelector(".course-card");
  await page.click(".course-card");
  await page.waitForSelector(".offering-row");
  const href = await page.locator(".offering-row a").first().getAttribute("href");
  if (!href) {
    throw new Error("没有找到班次");
  }
  return href.replace("/offerings/", "/write/");
}

test("键盘可以完成登录", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await waitForHydration(page);
  await page.click("#login-username");
  await page.keyboard.type("guo");
  await page.keyboard.press("Tab");
  await page.keyboard.type("123456");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/", { timeout: 30000 });
  expect(page.url()).toContain("3000/");
});

test("星级评分支持方向键，空表单显示错误", async ({ page }) => {
  await loginAdmin(page);
  await page.goto(await writePagePath(page), { waitUntil: "networkidle" });
  await page.waitForSelector("#review-content");

  const firstStar = page
    .locator(".field")
    .filter({ hasText: "难度" })
    .first()
    .locator('input[type="radio"]')
    .first();
  await firstStar.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page
      .locator(".field")
      .filter({ hasText: "难度" })
      .first()
      .locator('input[type="radio"]')
      .nth(1),
  ).toBeChecked();

  await page.click('.detail-grid form button[type="submit"]');
  await expect(page.locator(".form-error").first()).toBeVisible();
});

test("举报对话框可以用 Esc 关闭", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/courses?q=操作系统", { waitUntil: "networkidle" });
  await page.waitForSelector(".course-card");
  await page.click(".course-card");
  await page.waitForSelector(".offering-row");
  await page.locator(".offering-row a").first().click();
  await page.waitForSelector(".review-card");

  await page.locator(".review-card .btn-ghost").first().click();
  await page.waitForSelector(".dialog-content");
  await page.keyboard.press("Escape");
  await expect(page.locator(".dialog-content")).toHaveCount(0);
});

test.describe("减少动态", () => {
  test.use({ reducedMotion: "reduce" });

  test("减少动态模式下首屏仍可读", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    expect(
      await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
    ).toBe(true);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".hero-sub")).toBeVisible();
  });
});
