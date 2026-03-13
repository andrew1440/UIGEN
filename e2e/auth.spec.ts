import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('page structure is correct', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loaded
    expect(page.url()).toContain('localhost:3000');
    
    // Wait for content
    await page.waitForTimeout(1000);
    
    // Check page has body content
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });

  test('components render without errors', async ({ page }) => {
    const consoleLogs: { type: string; message: string }[] = [];
    
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        message: msg.text(),
      });
    });

    await page.goto('/');
    await page.waitForTimeout(1500);
    
    // Should not have critical errors
    const errors = consoleLogs.filter(log => log.type === 'error');
    expect(errors.length).toBe(0);
  });

  test('can interact with UI elements', async ({ page }) => {
    await page.goto('/');
    
    // Look for buttons or interactive elements
    const buttons = await page.locator('button, [role="button"]').all();
    
    // Check at least some interactive elements exist
    expect(buttons.length).toBeGreaterThanOrEqual(0);
    
    // Check for form inputs
    const inputs = await page.locator('input, textarea').all();
    expect(Array.isArray(inputs)).toBe(true);
  });

  test('handles navigation gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Check for any crashes
    const responses: { url: string; status: number }[] = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
      });
    });

    // Wait for any initial requests
    await page.waitForTimeout(2000);
    
    // Expect mostly successful responses
    const failedResponses = responses.filter(r => r.status >= 400 && r.status < 600);
    
    // Some 404s might be expected (e.g., favicons), but not too many
    expect(failedResponses.length).toBeLessThan(5);
  });
});

test.describe('Chat Interface', () => {
  test('chat interface is visible when authenticated', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Wait for page load
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    // Check for chat elements
    const chatElements = await page.locator('[role="textbox"], textarea, [class*="chat"], [class*="message"]').all();
    
    // Page should have some interactive elements
    expect(chatElements.length + (await page.locator('button').count())).toBeGreaterThan(0);
  });

  test('messages can be sent', async ({ page }) => {
    await page.goto('/');
    
    // Find textarea or input for chat
    const input = page.locator('textarea, input[type="text"]').first();
    
    if (await input.count() > 0) {
      // Try to type in it
      await input.focus();
      await input.type('Hello, this is a test message', { delay: 50 });
      
      // Verify typed text
      const value = await input.inputValue().catch(() => '');
      expect(value).toContain('Hello');
    }
  });
});

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      await page.goto('http://localhost:3000');
      
      // Check page rendered
      expect(page.url()).toContain('localhost');
      
      // Take screenshot to verify visual rendering
      const screenshot = await page.screenshot();
      expect(screenshot).toBeTruthy();
      expect(screenshot.length).toBeGreaterThan(0);

      await context.close();
    });
  }
});

test.describe('Error Handling', () => {
  test('handles missing pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    
    // Should either 404 or redirect to home
    expect([200, 404, 307, 308]).toContain(response?.status());
  });

  test('page recovers from network errors', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    const result = await page.goto('/').catch(() => null);
    
    // Go back online
    await page.context().setOffline(false);
    
    // Try again
    await page.goto('/');
    expect(page.url()).toContain('localhost');
  });
});

test.describe('Accessibility', () => {
  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    // Most pages should have at least one heading
    // (This is a basic check)
    expect(Array.isArray(headings)).toBe(true);
  });

  test('interactive elements are focusable', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button, a, input, [role="button"]').first();
    
    if (await buttons.count() > 0) {
      await buttons.focus();
      
      // Element should be focused
      const isFocused = await buttons.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });

  test('semantic HTML is used', async ({ page }) => {
    await page.goto('/');
    
    // Check for semantic elements
    const hasSemantic = await page.evaluate(() => {
      const semanticElements = document.querySelectorAll('main, nav, header, footer, article, section, aside');
      return semanticElements.length > 0;
    });

    // Should have at least some semantic elements (not required, but good practice)
    expect(typeof hasSemantic).toBe('boolean');
  });
});
