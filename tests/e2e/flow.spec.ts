import { expect, type Page, test } from "@playwright/test";

async function waitForHydration(page: Page) {
  await page.waitForSelector(".user-menu-loading", {
    state: "detached",
    timeout: 30000,
  });
}

async function setScore(page: Page, label: string, index: number) {
  const field = page.locator(".field").filter({ hasText: label }).first();
  await field.locator('input[type="radio"]').nth(index).check({ force: true });
}

async function openOffering(page: Page, query: string): Promise<string> {
  await page.goto(`/courses?q=${encodeURIComponent(query)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector(".course-card");
  await page.click(".course-card");
  await page.waitForSelector(".offering-row");
  const href = await page.locator(".offering-row a").first().getAttribute("href");
  if (!href) {
    throw new Error("没有找到班次链接");
  }
  return href;
}

async function register(page: Page, username: string) {
  await page.goto("/register", { waitUntil: "networkidle" });
  await waitForHydration(page);
  await page.fill("#register-username", username);
  await page.fill("#register-email", `${username}@example.local`);
  await page.fill("#register-password", "Test1234");
  await page.fill("#register-confirm", "Test1234");
  await page.click('.auth-grid form button[type="submit"]');
  await page.waitForURL("**/me", { timeout: 30000 });
}

async function login(page: Page, username: string, password: string) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await waitForHydration(page);
  await page.fill("#login-username", username);
  await page.fill("#login-password", password);
  await page.click('.auth-grid form button[type="submit"]');
  await page.waitForURL("**/", { timeout: 30000 });
}

async function fillReview(
  page: Page,
  content: string,
  options: { recommendationIndex?: number } = {},
) {
  await setScore(page, "难度", 3);
  await setScore(page, "作业量", 2);
  await setScore(page, "推荐度", options.recommendationIndex ?? 4);
  await page.locator("fieldset.chip-group").first().locator("button").first().click();
  await page.locator("fieldset.chip-group").nth(1).locator("button").first().click();
  await page.fill("#review-content", content);
}

test("完整用户流程：注册、搜索、写评价、有用、举报、后台隐藏、主题和移动端", async ({ page }) => {
  test.setTimeout(180000);
  const stamp = String(Date.now()).slice(-6);
  const username = `e2e${stamp}`;
  const marker = `E2E 端到端评价 ${stamp}`;
  const content = `${marker}。实验安排清楚，作业量中等，期末闭卷但范围明确。`;
  const mobileMarker = `E2E 移动端评价 ${stamp}`;
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" && !text.includes("WebSocket") && !text.includes("_rsc")) {
      consoleErrors.push(text);
    }
  });

  await register(page, username);
  await expect(page.locator(".prose h2")).toContainText(username);

  const offeringPath = await openOffering(page, "操作系统");
  const writePath = offeringPath.replace("/offerings/", "/write/");
  await page.goto(writePath, { waitUntil: "networkidle" });
  await page.waitForSelector("#review-content");
  await fillReview(page, content);
  await page.click('.detail-grid form button[type="submit"]');
  await page.waitForURL(`**${offeringPath}`, { timeout: 30000 });
  await page.waitForTimeout(1200);

  const myCard = page.locator(".review-card").filter({ hasText: marker }).first();
  await expect(myCard).toBeVisible();
  await expect(myCard).not.toContainText(username);

  const otherCard = page.locator(".review-card").filter({ hasNotText: marker }).first();
  const helpfulButton = otherCard.locator(".helpful-wrap button");
  await helpfulButton.click();
  await expect(otherCard.locator(".helpful-wrap button")).toHaveAttribute("aria-pressed", "true");

  await otherCard.locator(".btn-ghost").click();
  await page.waitForSelector(".dialog-content");
  await page.selectOption(".dialog-content select", "PRIVACY");
  await page.fill(".dialog-content textarea", "E2E 举报测试：疑似包含个人联系方式。");
  await page.click('.dialog-content button[type="submit"]');
  await expect(page.locator(".dialog-content .form-message")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.click(".theme-toggle");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await page.reload({ waitUntil: "networkidle" });
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector(".user-chip");
  await page.locator(".user-menu button").click();
  await page.waitForTimeout(1000);
  await login(page, "guo", "123456");

  await page.goto("/admin/reviews?status=PUBLISHED", {
    waitUntil: "networkidle",
  });
  const adminRow = page.locator("tbody tr", { hasText: marker }).first();
  await expect(adminRow).toBeVisible();
  await adminRow.locator(".admin-actions .btn-danger").first().click();
  await page.waitForSelector(".dialog-content");
  await page.fill(".dialog-content textarea", "E2E 测试隐藏");
  await page.click(".dialog-content .btn-danger");
  await expect(page.locator("tbody tr", { hasText: marker })).toHaveCount(0);

  await page.goto(offeringPath, { waitUntil: "networkidle" });
  await expect(page.getByText(marker)).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileOffering = await openOffering(page, "数据结构");
  await page.goto(mobileOffering.replace("/offerings/", "/write/"), {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("#review-content");
  await fillReview(page, `${mobileMarker}。手机宽度下也能完成填写和提交。`);
  await page.click('.detail-grid form button[type="submit"]');
  await page.waitForURL(`**${mobileOffering}`, { timeout: 30000 });
  await expect(page.getByText(mobileMarker)).toBeVisible();

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth);

  expect(consoleErrors).toEqual([]);
});
