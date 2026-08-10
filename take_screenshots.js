const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'play_store_screenshots');

// Ensure output directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 4 Standard Play Store Viewport Sizes
const VIEWPORTS = [
  { name: 'Phone', width: 1080, height: 1920, deviceScaleFactor: 2 },
  { name: 'Tablet_7_inch', width: 1200, height: 1920, deviceScaleFactor: 2 },
  { name: 'Tablet_10_inch', width: 1600, height: 2560, deviceScaleFactor: 2 },
  { name: 'Chromebook', width: 1920, height: 1080, deviceScaleFactor: 2 },
  { name: 'android_xr', width: 1080, height: 1920, deviceScaleFactor: 2 },
  { name: 'Feature_Graphic', width: 1024, height: 500, deviceScaleFactor: 2 }
];

const TARGET_URL = 'http://localhost:8082';

// 8 Screens to capture
const SCREENS = [
  { name: '01_Onboarding1', path: '/onboarding' },
  { name: '02_Onboarding2', path: '/onboarding' }, // We'll click next for this one
  { name: '03_Home', path: '/home' },
  { name: '04_AI_Insights', path: '/ai' },
  { name: '05_Reports', path: '/reports' },
  { name: '06_Medicines', path: '/medicines' },
  { name: '07_Profile', path: '/profile' },
  { name: '08_Family', path: '/family' },
];

(async () => {
  console.log('🚀 Starting Screenshot Automation...');
  
  // Launch non-headless so the user can log in
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: [
      '--window-size=1080,1920',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-data-dir=' + path.join(__dirname, 'puppeteer_tmp')
    ]
  });
  const page = await browser.newPage();
  
  // 1. Capture Onboarding Screens First (No login required)
  console.log('📸 Capturing Onboarding Screens...');
  for (const viewport of VIEWPORTS) {
    await page.setViewport(viewport);
    try {
      await page.goto(`${TARGET_URL}/onboarding`, { waitUntil: 'load', timeout: 60000 });
    } catch (err) {
      if (!err.message.includes('ERR_ABORTED')) throw err;
    }
    await new Promise(r => setTimeout(r, 4000)); // Wait for Expo to compile on first load

    // Screenshot 1
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewport.name}_01_Onboarding1.png`) });
    
    // Attempt to click 'Next' or simulate scrolling to next onboarding slide if it's a carousel
    await page.mouse.wheel({ deltaY: 800 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${viewport.name}_02_Onboarding2.png`) });
  }

  // 2. Automated Login
  console.log('\n=========================================');
  console.log('🤖 AUTOMATED LOGIN: Logging in with credentials...');
  console.log('=========================================\n');
  
  try {
    await page.goto(`${TARGET_URL}/login`, { waitUntil: 'load', timeout: 60000 });
  } catch (err) {
    if (!err.message.includes('ERR_ABORTED')) throw err;
  }
  
  try {
    // Wait for the email input field to appear
    await page.waitForSelector('input[placeholder="Enter your email address"]', { timeout: 15000 });
    
    // Wait for manual login instead of injecting credentials
    console.log('🤖 Please log in manually in the browser window within the next 60 seconds...');
    
    // Wait until the URL changes to /home (meaning login was successful)
    await page.waitForFunction('window.location.pathname.includes("/home")', { timeout: 60000 });
    console.log('✅ Login detected! Proceeding to capture internal screens...');
  } catch (e) {
    console.log('❌ Login timeout reached. Did you log in? Exiting...', e);
    await browser.close();
    return;
  }

  // 3. Capture Internal Screens for each viewport
  const internalScreens = SCREENS.slice(2);

  for (const viewport of VIEWPORTS) {
    console.log(`\n📱 Setting viewport to ${viewport.name} (${viewport.width}x${viewport.height})...`);
    await page.setViewport(viewport);

    for (const screen of internalScreens) {
      console.log(`   📸 Capturing ${screen.name}...`);
      try {
        await page.goto(`${TARGET_URL}${screen.path}`, { waitUntil: 'load', timeout: 60000 });
      } catch (err) {
        if (!err.message.includes('ERR_ABORTED')) throw err;
      }
      
      // Wait extra time for API data to load and render
      await new Promise(r => setTimeout(r, 2000)); 
      
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, `${viewport.name}_${screen.name}.png`) 
      });
    }
  }

  console.log('\n🎉 All 32 screenshots captured successfully!');
  console.log(`📂 Saved to: ${SCREENSHOT_DIR}`);
  
  await browser.close();
})();
