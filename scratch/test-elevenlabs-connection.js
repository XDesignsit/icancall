const fs = require('fs');
const path = require('path');

const envFiles = [
  '.env.local',
  '.env.development.local',
  '.env.production.local',
  '.env.preview.local',
  '.env'
];

let apiKey = process.env.ELEVENLABS_API_KEY;
let foundInFile = null;

if (!apiKey) {
  for (const file of envFiles) {
    try {
      const envPath = path.join(__dirname, '..', file);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/^\s*ELEVEN_?LABS_API_KEY\s*=\s*(.*?)\s*$/m);
        if (match) {
          apiKey = match[1].trim().replace(/['"]/g, ''); // strip optional quotes
          foundInFile = file;
          break;
        }
      }
    } catch (err) {
      console.warn(`Could not read file ${file}:`, err.message);
    }
  }
}

if (!apiKey) {
  console.error('❌ Error: ELEVENLABS_API_KEY is missing in process.env and all env files.');
  process.exit(1);
}

console.log(`Found API Key in ${foundInFile || 'environment variables'}. Testing active connection via TTS generation...`);

// Test text-to-speech generation using Rachel voice
const voiceId = '21m00Tcm4TlvDq8ikWAM';
fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: {
    'xi-api-key': apiKey,
    'Content-Type': 'application/json',
    'accept': 'audio/mpeg'
  },
  body: JSON.stringify({
    text: 'Test connection successful.',
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  })
})
.then(async (response) => {
  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    console.log('✅ Connection Successful! Verified ElevenLabs TTS generation permissions.');
    console.log(`Received Audio Buffer: ${arrayBuffer.byteLength} bytes.`);
  } else {
    const errText = await response.text();
    console.error(`❌ Connection Failed. ElevenLabs API returned HTTP ${response.status}:`);
    console.error(errText);
    process.exit(1);
  }
})
.catch((error) => {
  console.error('❌ Network Connection Error trying to reach ElevenLabs API:', error.message);
  process.exit(1);
});
