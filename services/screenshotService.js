const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const takeScreenshots = async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  
  await page.goto(`${process.env.FRONTEND_URL}/dashboard`, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  //element to capture
  const captureTargets = [
    { selector: '#newsletter-capture-target', filename: 'newsletter-main.png' },
    { selector: '#compPrice', filename: 'comparison.png' },
    { selector: '#trend', filename: 'trend.png' }
  ];

  //  directory 
  const screenshotDir = path.join(__dirname, '../screenshots');
await fs.promises.mkdir(screenshotDir, { recursive: true });


  const screenshotPaths = [];

  // Capture all targets
  for (const target of captureTargets) {
    try {
      console.log(`Attempting to capture ${target.selector}`);
      await page.waitForSelector(target.selector, { 
        timeout: 30000,
        visible: true
      });
      
      const element = await page.$(target.selector);
      if (!element) {
        console.warn(`Element ${target.selector} not found`);
        continue;
      }
      
      // Use waitFor with timeout instead of waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const boundingBox = await element.boundingBox();
      
      if (!boundingBox) {
        console.warn(`Element ${target.selector} is not visible or has zero size`);
        continue;
      }
      
      const screenshotPath = path.join(screenshotDir, target.filename);
      
      // Take screenshot without quality parameter for PNG
      await element.screenshot({
        path: screenshotPath,
        type: 'png',
        omitBackground: true
      });
      
      console.log(`Successfully captured ${target.selector} as ${target.filename}`);
      screenshotPaths.push(screenshotPath);
      
    } catch (err) {
      console.error(`Failed to capture ${target.selector}:`, err.message);
      
      // Fallback: Capture full page if element screenshot fails
      try {
        const screenshotPath = path.join(screenshotDir, `fullpage-${target.filename}`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          type: 'png'
        });
        console.log(`Captured fallback full page screenshot as ${screenshotPath}`);
        screenshotPaths.push(screenshotPath);
      } catch (fallbackErr) {
        console.error(`Failed to capture fallback screenshot for ${target.selector}:`, fallbackErr.message);
      }
    }
  }
  
  console.log(`Successfully captured ${screenshotPaths.length} screenshots`);

  await browser.close();
  return screenshotPaths;
};

module.exports = { takeScreenshots };