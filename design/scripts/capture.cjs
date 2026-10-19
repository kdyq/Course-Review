const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4173";
const OUT = path.join(__dirname, "..", "screenshots");

fs.mkdirSync(OUT, { recursive: true });

async function scrollThrough(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 620) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(130);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function capturePrototype(browser, name, url, interactions) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });
  const page = await context.newPage();
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("requestfailed", (request) => {
    errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ""}`);
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1300);

  await page.screenshot({ path: path.join(OUT, `${name}-hero-light.png`) });
  await scrollThrough(page);
  await page.screenshot({ path: path.join(OUT, `${name}-light.png`), fullPage: true });

  await page.click("[data-theme-toggle]");
  await page.waitForTimeout(600);
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);

  await page.screenshot({ path: path.join(OUT, `${name}-hero-dark.png`) });
  await page.screenshot({ path: path.join(OUT, `${name}-dark.png`), fullPage: true });

  let interaction = {};
  if (interactions) {
    try {
      interaction = await interactions(page);
    } catch (error) {
      interaction = { error: error.message };
    }
  }

  console.log(JSON.stringify({ name, theme, errors, interaction }, null, 2));
  await context.close();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--disable-gpu", "--hide-scrollbars"],
  });

  try {
    const galleryContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
    });
    const galleryPage = await galleryContext.newPage();
    await galleryPage.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await galleryPage.waitForTimeout(500);
    await galleryPage.screenshot({ path: path.join(OUT, "gallery.png"), fullPage: true });
    await galleryContext.close();

    await capturePrototype(browser, "style-a", `${BASE}/design/style-a/`, async (page) => {
      await page.click('[data-rank-tab="difficulty"]');
      await page.waitForTimeout(400);
      const firstScore = await page.locator(".rank-list li").first().locator(".rank-score strong").innerText();
      const firstCourse = await page.locator(".rank-list li").first().locator(".rank-course strong").innerText();
      return { firstCourse, firstScore };
    });

    await capturePrototype(browser, "style-b", `${BASE}/design/style-b/`, async (page) => {
      await page.fill("#course-search", "zzz-no-match");
      await page.waitForTimeout(350);
      const emptyVisible = await page.locator("[data-empty-state]").isVisible();
      await page.click("[data-reset-filter]");
      await page.waitForTimeout(350);
      await page.click('[data-filter="cs"]');
      await page.waitForTimeout(350);
      const visibleCards = await page.locator("[data-course-grid] .course-card:not([hidden])").count();
      return { emptyVisible, visibleCsCards: visibleCards };
    });

    await capturePrototype(browser, "style-c", `${BASE}/design/style-c/`, async (page) => {
      const recommendationGroup = page.locator("[data-rating-group]").nth(2);
      await recommendationGroup.locator('button[data-value="4"]').click();
      const ratingOutput = await recommendationGroup.locator(".rating-output").innerText();
      await page.fill("#review-content", "这是一条用于检查表单成功状态的演示评价。");
      await page.click('#review-form button[type="submit"]');
      await page.waitForTimeout(400);
      const message = await page.locator("[data-form-message]").innerText();
      const messageClass = await page.locator("[data-form-message]").getAttribute("class");
      return { ratingOutput, message, messageClass };
    });
  } finally {
    await browser.close();
  }
})();
