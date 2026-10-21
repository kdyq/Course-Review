import { expect, test } from "@playwright/test";

const FORBIDDEN = ["userId", "authorId", "reviewAuthor", "email", "@example.local"];

test("公开页面不泄露作者身份，小样本不显示平均分", async ({ page }) => {
  await page.goto("/courses?q=操作系统", { waitUntil: "networkidle" });
  await page.waitForSelector(".course-card");
  await page.click(".course-card");
  await page.waitForSelector(".offering-row");

  const courseHtml = await page.content();
  for (const token of FORBIDDEN) {
    expect(courseHtml).not.toContain(token);
  }

  await page.locator(".offering-row a").first().click();
  await page.waitForSelector(".review-card");
  const offeringHtml = await page.content();
  for (const token of FORBIDDEN) {
    expect(offeringHtml).not.toContain(token);
  }
  expect(offeringHtml).toContain("匿名同学");
  expect(offeringHtml).not.toContain("student01");
  expect(offeringHtml).not.toContain("seeduser");

  await page.goto("/courses?q=生命科学导论", { waitUntil: "networkidle" });
  await page.waitForSelector(".course-card");
  await page.click(".course-card");
  await page.waitForSelector(".offering-row");
  await expect(page.locator(".sample-note")).toHaveCount(1);
  await page.locator(".offering-row a").first().click();
  await page.waitForSelector(".review-card");
  await expect(page.locator(".sample-note")).toHaveCount(1);
  await expect(page.locator(".rating-average")).toHaveCount(0);
});

test("管理员审核列表默认不显示作者", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.waitForSelector(".user-menu-loading", { state: "detached" });
  await page.fill("#login-username", "guo");
  await page.fill("#login-password", "123456");
  await page.click('.auth-card form button[type="submit"]');
  await page.waitForURL("**/", { timeout: 30000 });

  await page.goto("/admin/reviews", { waitUntil: "networkidle" });
  const html = await page.content();
  expect(html).not.toContain("@example.local");
  expect(html).not.toContain("seeduser");
});
