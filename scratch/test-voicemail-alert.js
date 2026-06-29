/**
 * Test script to trigger the /api/send-voicemail-alert endpoint
 * Usage: node scratch/test-voicemail-alert.js <recipient-email> [target-url]
 * Example (production): node scratch/test-voicemail-alert.js holder@example.com https://app.icancall.co
 * Example (local): node scratch/test-voicemail-alert.js holder@example.com http://localhost:3000
 */

const http = require('http');
const https = require('https');

async function main() {
  const email = process.argv[2];
  const targetUrlStr = process.argv[3] || 'https://app.icancall.co';

  if (!email) {
    console.error('❌ Error: Recipient email address is required.');
    console.log('\nUsage:');
    console.log('  node scratch/test-voicemail-alert.js <recipient-email> [target-url]');
    console.log('\nExamples:');
    console.log('  node scratch/test-voicemail-alert.js user@example.com https://app.icancall.co');
    console.log('  node scratch/test-voicemail-alert.js user@example.com http://localhost:3000\n');
    process.exit(1);
  }

  let targetUrl;
  try {
    targetUrl = new URL(targetUrlStr);
  } catch (err) {
    console.error(`❌ Error: Invalid target URL "${targetUrlStr}"`);
    process.exit(1);
  }

  const endpoint = '/api/send-voicemail-alert';
  const postData = JSON.stringify({
    email: email,
    callerName: 'Jane Smith (Test)',
    duration: '22 seconds',
    recordingLink: 'https://api.twilio.com/2010-04-01/Accounts/ACxxx/Recordings/RExxx.mp3',
    transcription: 'Hello, this is a test voicemail to verify that the transcription and email dispatch system is working correctly for the sub-account holder!'
  });

  console.log(`🔗 Target: ${targetUrl.origin}${endpoint}`);
  console.log(`✉️ Sending test alert to: ${email}...`);

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const client = targetUrl.protocol === 'https:' ? https : http;

  const req = client.request(options, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log(`\nStatus Code: ${res.statusCode} ${res.statusMessage}`);
      console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
      try {
        const parsed = JSON.parse(body);
        console.log('\nResponse Body:\n', JSON.stringify(parsed, null, 2));
        if (res.statusCode === 200 && parsed.messageId) {
          console.log('\n✅ Success! The test voicemail alert has been dispatched successfully.');
        } else {
          console.log('\n❌ Failed: Server returned an error.');
        }
      } catch (err) {
        console.log('\nRaw Response Body:\n', body);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Network request error: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

main();
