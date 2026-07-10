const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not set in .env');
  process.exit(1);
}

const aiClient = new GoogleGenerativeAI(apiKey);

async function testAiParse() {
  const htmlPath = path.join(__dirname, 'decoded.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('decoded.html does not exist. Run parse_mht.js first.');
    return;
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  console.log('HTML file size:', htmlContent.length, 'bytes');

  // Let's strip script and style tags to minimize token count
  let cleanHtml = htmlContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '');
  console.log('Cleaned HTML size:', cleanHtml.length, 'bytes');

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are an expert data scraper. Review this Google Search results HTML page.
      Extract all local business listings (clinics) found.
      
      Look closely for:
      - business_name: Name of the clinic.
      - website_url: The actual website domain link (e.g. "mombasahospital.com" or similar). Search the HTML attributes like href, data-website, data-url. Ignore search aggregator/directories like Yelp or Yellowpages. If no direct website is listed, leave blank or null.
      - phone: The phone number (search for tel: links, data-phone-number, data-tel, or similar attributes, even if they show up as call icons visually).
      - address: Physical location address or street.
      - snippet: A 1-2 sentence summary of what they do or review quotes if available in the text.
      
      Output the results as a raw JSON array of objects. Do NOT wrap in markdown fences or include any conversational intro/outro text. Only raw JSON.

      HTML Content:
      ${cleanHtml.substring(0, 200000)}
    `;

    console.log('Sending query to Gemini 2.5 Flash...');
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    if (text.startsWith('```json')) text = text.substring(7);
    if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    text = text.trim();

    console.log('Raw response:');
    console.log(text);

    const parsed = JSON.parse(text);
    console.log('Parsed clinics:', parsed.length);
    console.log(JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.error('Failed to parse HTML:', err.message);
  }
}

testAiParse();
