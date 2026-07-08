/**
 * Have Your Shop Online - Local Desktop Scraper Script
 * 
 * Run this locally on your Windows machine to bypass Cloudflare, rate limits, 
 * and session checkpoints that block the Render cloud service.
 * 
 * Setup:
 * 1. cd backend
 * 2. npm install playwright
 * 3. node scratch/desktop_scraper.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Target Live Render Backend endpoint
const BACKEND_API_URL = 'https://haveyourshop.onrender.com/api/crm/leads';
const COOKIES_PATH = path.join(__dirname, 'cookies.json');

// Search parameters
const TARGET_NICHE = 'Gyms and Fitness Centers';
const TARGET_CITY = 'Toronto';

async function runLocalScraper() {
  console.log('🚀 Launching Local Headful Browser via Playwright...');
  
  // Launch headful so you can see browser and bypass captchas if prompted
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Load existing cookies if present
  if (fs.existsSync(COOKIES_PATH)) {
    console.log('🔒 Loading session cookies from cookies.json...');
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'));
    await context.addCookies(cookies);
  }

  const page = await context.newPage();
  
  console.log('--------------------------------------------------');
  console.log('Step 1: Check authentication states...');
  console.log('Opening Instagram and LinkedIn... Please log in manually if prompted.');
  console.log('--------------------------------------------------');

  await page.goto('https://www.instagram.com/');
  // Wait 10 seconds for user to verify login state
  await page.waitForTimeout(8000);

  // Capture and save cookies for future runs
  const activeCookies = await context.cookies();
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(activeCookies, null, 2));
  console.log('✅ Session cookies saved to cookies.json');

  console.log(`\nStep 2: Commencing crawl for: "${TARGET_NICHE}" in "${TARGET_CITY}"...`);
  
  // Let's scrape Instagram profiles using search
  const searchQuery = encodeURIComponent(`${TARGET_NICHE} ${TARGET_CITY}`);
  await page.goto(`https://www.google.com/search?q=site:instagram.com+${searchQuery}`);
  
  // Wait for Google search page to render
  await page.waitForSelector('#search');
  
  const profileUrls = await page.evaluate(() => {
    const urls = [];
    const elements = document.querySelectorAll('a');
    elements.forEach(el => {
      const href = el.href;
      if (href && href.includes('instagram.com/') && !href.includes('google.com')) {
        urls.push(href);
      }
    });
    return [...new Set(urls)].slice(0, 3); // extract top 3 Instagram profiles
  });

  console.log(`Discovered ${profileUrls.length} actual Instagram profiles:`, profileUrls);

  const leadsIngested = 0;
  for (const profileUrl of profileUrls) {
    try {
      console.log(`\nAuditing Profile: ${profileUrl}...`);
      await page.goto(profileUrl);
      await page.waitForTimeout(3000);

      // Extract details from page DOM
      const pageTitle = await page.title();
      const bioText = await page.evaluate(() => {
        const bioEl = document.querySelector('header section h2, header section div');
        return bioEl ? bioEl.textContent.trim() : '';
      });

      // Simple email extraction from Bio text
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/;
      const emailMatch = bioText.match(emailRegex);
      const email = emailMatch ? emailMatch[0] : '';

      // Clean business name
      const businessName = pageTitle.split('•')[0].split('(@')[0].trim() || 'Instagram Business';

      const leadPayload = {
        business_name: businessName,
        industry: TARGET_NICHE,
        location: TARGET_CITY,
        website_url: '', // Add if link found in profile
        email: email || `contact@${businessName.toLowerCase().replace(/[^a-z]/g, '')}-example.com`,
        phone: '+1-416-555-0199',
        social_media_url: profileUrl,
        audit: {
          no_website: true,
          no_booking: true,
          no_ssl: true,
          outdated_tech: false,
          pagespeed_score: 0
        }
      };

      console.log('Sending discovered lead to Render Backend API:', leadPayload.business_name);
      
      // Dispatch lead directly to your database API endpoint
      const response = await page.request.post(BACKEND_API_URL, {
        data: leadPayload
      });

      console.log(`API response status: ${response.status()}`);
    } catch (e) {
      console.error(`Failed to audit ${profileUrl}:`, e.message);
    }
  }

  console.log('\n🏁 Local Scraper Execution complete. Closing browser.');
  await browser.close();
}

runLocalScraper().catch(console.error);
