// test-puppeteer.mjs
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.goto("https://example.com", { waitUntil: "networkidle2" });
console.log("✅ Puppeteer is working and Chromium is rendering.");
await browser.close();
