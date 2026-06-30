require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing key with models listed in the REST response...');

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest'
  ];

  for (const m of models) {
    try {
      console.log(`Sending query with model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('Say exactly "Hello World".');
      console.log(`✅ SUCCESS WITH MODEL "${m}":`, result.response.text());
      return;
    } catch (err) {
      console.log(`❌ FAILED WITH MODEL "${m}":`, err.message);
    }
  }
}

run();
