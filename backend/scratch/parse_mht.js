const fs = require('fs');
const path = require('path');

const mhtPath = "C:\\Users\\USER\\SWE\\website\\public\\top rated clinics in mombasa - Google Search.mht";

function decodeQuotedPrintable(str) {
  return str
    .replace(/=\r?\n/g, '') // Remove soft line breaks
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

try {
  const content = fs.readFileSync(mhtPath, 'utf-8');
  console.log('File size:', content.length, 'characters');
  
  // Find boundaries
  const lines = content.split('\n');
  console.log('First 20 lines:');
  for (let i = 0; i < 20; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
  
  // Try to find the HTML part
  // MIME boundaries can vary. Let's inspect the headers to find the boundary.
  const boundaryMatch = content.match(/boundary="([^"]+)"/);
  const boundary = boundaryMatch ? boundaryMatch[1] : null;
  console.log('Boundary:', boundary);
  
  if (boundary) {
    const parts = content.split('--' + boundary);
    console.log('Number of parts:', parts.length);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('Content-Type: text/html')) {
        console.log(`Part ${i} is HTML! Length:`, part.length);
        // Find double CRLF separating headers and body
        const headerEnd = part.indexOf('\r\n\r\n');
        const body = headerEnd !== -1 ? part.substring(headerEnd + 4) : part;
        const decoded = decodeQuotedPrintable(body);
        console.log('Decoded part length:', decoded.length);
        fs.writeFileSync(path.join(__dirname, 'decoded.html'), decoded);
        console.log('Saved decoded HTML to decoded.html');
        break;
      }
    }
  } else {
    console.log('No boundary found.');
  }
} catch (err) {
  console.error('Error:', err.message);
}
