const fs = require('fs');
const path = require('path');
const { parsePastedLeads } = require('../src/services/gemini');

async function testMhtParser() {
  const mhtPath = "C:\\Users\\USER\\SWE\\website\\dist\\top rated clinics in mombasa - Google Search.mht";
  if (!fs.existsSync(mhtPath)) {
    console.error(`MHT file not found at: ${mhtPath}`);
    return;
  }

  const fileContent = fs.readFileSync(mhtPath, 'utf8');
  console.log(`✅ Loaded MHT file of size: ${fileContent.length} bytes.`);

  // Decode MHT using backend decoders
  function decodeQuotedPrintable(str) {
    return str
      .replace(/=\r?\n/g, '') // Remove soft line breaks
      .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  function extractHtmlFromMht(content) {
    const boundaryMatch = content.match(/boundary=(?:"([^"]+)"|([^\s\r\n;]+))/i);
    const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;
    if (boundary) {
      console.log(`Boundary matches: "${boundary}"`);
      const parts = content.split('--' + boundary);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.includes('Content-Type: text/html')) {
          const headerEnd = part.indexOf('\r\n\r\n');
          const body = headerEnd !== -1 ? part.substring(headerEnd + 4) : part;
          
          const isBase64 = part.includes('Content-Transfer-Encoding: base64');
          if (isBase64) {
            console.log('Detected base64 transfer encoding.');
            const cleanedBody = body.replace(/[\r\n\s]+/g, '');
            return Buffer.from(cleanedBody, 'base64').toString('utf-8');
          }
          console.log('Detected quoted-printable transfer encoding.');
          return decodeQuotedPrintable(body);
        }
      }
    }
    return content;
  }

  const cleanHtml = extractHtmlFromMht(fileContent);
  console.log(`Decoded clean HTML size: ${cleanHtml.length} characters.`);

  const miniHtml = cleanHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '')
    .substring(0, 500000);

  console.log(`Mini HTML size: ${miniHtml.length} characters.`);

  console.log('Parsing with Gemini parser...');
  try {
    const leads = await parsePastedLeads(miniHtml, 'Clinics', 'Mombasa');
    console.log(`🎉 Success! Extracted ${leads.length} leads.`);
    console.log(JSON.stringify(leads.slice(0, 3), null, 2));
  } catch (err) {
    console.error(`❌ Failed parsing: ${err.message}`);
  }
}

testMhtParser();
