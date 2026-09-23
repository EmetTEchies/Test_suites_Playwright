// tests/RateIncomeAdd.spec.js
import { test, expect } from '@playwright/test';

// Your app base URL
const BASE_URL = 'http://192.168.0.202//TRMS_MCP';

test('login to TRMS and navigate to Rate Income Add', async ({ page }) => {
  // 1. Suppress application JavaScript errors (these are pre-existing app bugs)
  page.on('pageerror', err => {
    // Ignore known app errors from rate_dashboard.js, missing resources, etc.
    if (err.message.includes('indexOf') ||
        err.message.includes('Graph container') ||
        err.message.includes('BlockPlanStart') ||
        err.message.includes("length")) {
      return; // silently ignore
    }
    console.log('APP ERROR:', err.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error' && 
        (msg.text().includes('404') || 
         msg.text().includes('indexOf') ||
         msg.text().includes('Graph container') ||
         msg.text().includes('BlockPlanStart') ||
         msg.text().includes("Cannot read properties of null"))) {
      return; // suppress known app noise
    }
  });

  // 2. Go to login page
  await page.goto(`${BASE_URL}/WebPages/Login/Login.aspx`);

  // 3. Wait for login page to load
  await page.waitForURL(/.*Login/i, { timeout: 15000 });

  // 4. Fill login form - use robust selectors
  await page.fill('input[name="Username"], input[name="txtUserName"], input[name="SLXtxt_UserName"]', 'Administrator');
  await page.fill('input[name="Password"], input[name="txtPassword"], input[name="SLXtxt_Password"]', 'test$123');

  // 5. Submit login
  const loginButton = page.getByRole('button', { name: /Log ?In/i });
  await loginButton.click();

  // 6. Wait for navigation after login
  await page.waitForTimeout(3000);

  // 7. Navigate to Rate Income Add page
  const rateIncomeAddUrls = [
    `${BASE_URL}/WebPages/ReceiptAdding/ReceiptAdd.aspx?SLGBln_AddMode=true&SLGByt_PaymentType=1&SLGLng_RBookID=-1&elementid=Rate_Receipt_Add`,
    `${BASE_URL}/ReceiptAdding/ReceiptAdd.aspx?SLGBln_AddMode=true&SLGByt_PaymentType=1&SLGLng_RBookID=-1&elementid=Rate_Receipt_Add`
  ];

  let navigated = false;
  for (const url of rateIncomeAddUrls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const currentUrl = page.url();
      if (currentUrl.includes('RateIncome')) {
        navigated = true;
        break;
      }
    } catch (e) {
      // Try next URL
    }
  }

  // If direct navigation failed, use menu navigation
  if (!navigated) {
    await page.getByRole('link', { name: /Rate Income/i }).click({ timeout: 10000 });
    await page.getByRole('link', { name: /Add/i }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }

  // 8. Verify Rate Income Add page loaded
  await expect(page).toHaveURL(/.*RateIncome/i);
  await expect(page.getByRole('heading', { name: /Rate Income Add/i })).toBeVisible();
});
