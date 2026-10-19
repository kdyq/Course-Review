import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.APP_BASE || "http://127.0.0.1:3000";
const OUT = path.join(process.cwd(), "design", "screenshots", "app");

const routes = process.argv.slice(2);
const targets = routes.length > 0 ? routes : ["/"];

fs.mkdirSync(OUT, { recursive: true });

function slug(value) {
  return value === "/" ? "home" : value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function scrollThrough(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 620) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function capture(browser, route, viewport, theme) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: theme,
  });
  await context.addInitScript((value) => {
    try {
      window.localStorage.setItem("course-review-theme", value);
    } catch {
      // ignore
    }
  }, theme);

  const page = await context.newPage();
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) =>
    errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ""}`),
  );

  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  const name = `${slug(route)}-${viewport.width}-${theme}`;
  await page.screenshot({ path: path.join(OUT, `${name}-hero.png`) });
  await scrollThrough(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });

  const result = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    title: document.title,
  }));

  await context.close();
  return { route, viewport: viewport.width, theme, name, errors, ...result };
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});

const results = [];
try {
  for (const route of targets) {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      for (const theme of ["light", "dark"]) {
        results.push(await capture(browser, route, viewport, theme));
      }
    }
  }
} finally {
  await browser.close();
}

for (const result of results) {
  console.log(JSON.stringify(result));
}
