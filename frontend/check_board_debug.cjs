const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1450, height: 900 } });

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: /войти/i }).click();
  await page.waitForURL('**/projects');
  await page.waitForSelector('table a[href^="/projects/"]', { timeout: 5000 });
  await page.locator('table a[href^="/projects/"]').first().click();
  await page.waitForSelector('.ant-tabs-tab', { timeout: 5000 });
  await page.waitForTimeout(300);
  await page.locator('.ant-tabs-tab', { hasText: 'Проектная доска' }).click();
  await page.waitForTimeout(1000);

  const canvasCount = await page.locator('canvas').count();
  console.log('canvas count:', canvasCount);
  for (let i = 0; i < canvasCount; i++) {
    console.log(i, await page.locator('canvas').nth(i).boundingBox());
  }

  const tlContainerCount = await page.locator('.tl-container').count();
  console.log('tl-container count:', tlContainerCount);
  if (tlContainerCount > 0) console.log('tl-container box:', await page.locator('.tl-container').boundingBox());

  const outerWrapper = await page.evaluate(() => {
    const el = document.querySelector('.tl-container');
    if (!el) return 'no tl-container';
    let node = el;
    const chain = [];
    for (let i = 0; i < 6 && node; i++) {
      const rect = node.getBoundingClientRect();
      chain.push({ tag: node.tagName, cls: node.className && node.className.toString().slice(0,60), rect: { w: rect.width, h: rect.height, x: rect.x, y: rect.y }, style: node.getAttribute('style') });
      node = node.parentElement;
    }
    return chain;
  });
  console.log(JSON.stringify(outerWrapper, null, 2));

  await browser.close();
})();
