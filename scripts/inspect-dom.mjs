import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to a typical mobile size
  await page.setViewportSize({ width: 375, height: 812 });
  
  console.log('--- MOBILE VIEWPORT (375x812) ---');
  await page.goto('https://sih-glbgoi.vercel.app/login');
  
  const report = await page.evaluate(() => {
    const elements = [];
    // Traverse DOM and find elements with width > 375 or scrollWidth > 375
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (rect.width > 375 || el.scrollWidth > 375 || rect.right > 375) {
        elements.push({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          width: rect.width,
          scrollWidth: el.scrollWidth,
          left: rect.left,
          right: rect.right,
          position: style.position,
          transform: style.transform,
          display: style.display,
          overflow: style.overflowX
        });
      }
    }
    return {
      html: {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      body: {
        width: document.body.clientWidth,
        scrollWidth: document.body.scrollWidth,
      },
      oversized: elements.slice(0, 15)
    };
  });
  
  console.log('HTML:', report.html);
  console.log('BODY:', report.body);
  console.log('Oversized Elements:', JSON.stringify(report.oversized, null, 2));
  
  await browser.close();
}

run().catch(console.error);
