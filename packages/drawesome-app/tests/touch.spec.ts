import { expect, test } from '@playwright/test';

// Deliberately inject the boundary event that interrupts affected phones.
// This is a regression for the event sequence, not physical iPhone emulation.
test('a touch stroke continues across a boundary event until the finger lifts', async ({ page }) => {
  await page.goto('/');
  const surface = page.locator('.zoom-inner > svg');
  await surface.evaluate(svg => {
    const rect = svg.getBoundingClientRect();
    const emit = (type: string, x: number) => svg.dispatchEvent(new PointerEvent(type, {
      bubbles: true, pointerId: 44, pointerType: 'touch', buttons: type === 'pointerup' ? 0 : 1,
      clientX: rect.x + x, clientY: rect.y + 80,
    }));
    emit('pointerdown', 40);
    emit('pointermove', 45);
    emit('pointerout', 45);
    for (let x = 60; x <= 240; x += 10) emit('pointermove', x);
    emit('pointerup', 240);
  });
  await expect.poll(() => page.evaluate(() => {
    const strokes = (window as any).__strokes;
    return strokes?.length === 1 ? strokes[0].points.length : 0;
  })).toBeGreaterThan(15);
  expect(await page.evaluate(() => {
    const points = (window as any).__strokes[0].points;
    return points.at(-1)[0] - points[0][0];
  })).toBeGreaterThan(300);
});

for (const ending of ['pointercancel', 'lostpointercapture']) {
  test(`${ending} discards a stroke and permits the next one`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.zoom-inner > svg').evaluate((svg, ending) => {
      const rect = svg.getBoundingClientRect();
      const emit = (type: string, id: number) => svg.dispatchEvent(new PointerEvent(type, {
        bubbles: true, pointerId: id, pointerType: 'touch', clientX: rect.x + 40, clientY: rect.y + 80,
      }));
      emit('pointerdown', 44); emit(ending, 44); emit('pointerup', 44);
      emit('pointerdown', 45); emit('pointerup', 45);
    }, ending);
    await expect.poll(() => page.evaluate(() => (window as any).__strokes?.length)).toBe(1);
  });
}

test('a real touch drag stays continuous', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP touch dragging is Chromium-only');
  await page.goto('/');
  const rect = await page.locator('.zoom-inner > svg').boundingBox();
  if (!rect) throw new Error('Missing drawing surface');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect.x + 40, y: rect.y + 80 }] });
  for (let i = 1; i <= 20; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: rect.x + 40 + i * 10, y: rect.y + 80 + i * 5 }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => (window as any).__strokes?.[0]?.points.length ?? 0)).toBeGreaterThan(15);
});
