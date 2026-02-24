const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(process.cwd(), 'artifacts', 'responsive');
  fs.mkdirSync(outDir, { recursive: true });

  const checks = [
    { name: 'Galaxy-S24', viewport: { width: 390, height: 844 } },
    { name: 'Pixel-8', viewport: { width: 393, height: 837 } },
    { name: 'Samsung-Tablet', viewport: { width: 800, height: 1280 } },
    { name: 'iPhone-15-16', viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, userAgent: devices['iPhone 14'].userAgent },
    { name: 'iPhone-SE', viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, userAgent: devices['iPhone SE'].userAgent },
    { name: 'iPad-mini', viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, userAgent: devices['iPad Mini'].userAgent },
  ];

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const cfg of checks) {
    const context = await browser.newContext({
      viewport: cfg.viewport,
      isMobile: cfg.isMobile ?? true,
      hasTouch: cfg.hasTouch ?? true,
      userAgent: cfg.userAgent,
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      mainHeight: window.innerHeight,
      supportsDvh: CSS.supports('height', '100dvh'),
    }));

    const filename = `${cfg.name}.png`;
    await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
    results.push({ device: cfg.name, ...metrics, screenshot: `artifacts/responsive/${filename}` });
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})();
