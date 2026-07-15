const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1450, height: 900 } });

  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: /войти/i }).click();
  await page.waitForURL('**/projects');
  await page.waitForSelector('table a[href^="/projects/"]', { timeout: 5000 });
  await page.waitForTimeout(200);

  const firstRowButtons = page.locator('tbody tr.ant-table-row').first().locator('button');
  console.log('buttons in first row:', await firstRowButtons.count());

  // add-member = index 3 (pin, like, edit, adduser, delete)
  await firstRowButtons.nth(3).click();
  await page.waitForTimeout(400);
  const selectCount = await page.locator('.ant-modal .ant-select').count();
  const modalTitle = await page.locator('.ant-modal-title').textContent();
  console.log('Add-member modal title:', modalTitle, 'select present:', selectCount > 0);
  await page.screenshot({ path: 'shot-add-member-modal2.png' });

  // pick a user and add
  await page.locator('.ant-modal .ant-select').click();
  await page.waitForTimeout(200);
  const optionText = await page.locator('.ant-select-item-option').first().textContent();
  await page.locator('.ant-select-item-option').first().click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Добавить' }).click();
  await page.waitForTimeout(400);
  console.log('Added user:', optionText);

  const modalGone = await page.locator('.ant-modal-title').count();
  console.log('Modal closed:', modalGone === 0);

  await browser.close();
})();
