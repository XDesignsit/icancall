const http = require('http');
const fs = require('fs');
const path = require('path');

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });
    req.on('error', e => reject(e));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('🚀 Starting voicemail SMS notification integration test...');

  // Load current local_db state to back up
  const dbPath = path.join(__dirname, 'local_db.json');
  const originalDb = fs.readFileSync(dbPath, 'utf8');

  try {
    // 1. Setup local_db profiles settings to include a valid smsPhone
    console.log('📝 Setting up mock profile with smsPhone and notifSMS...');
    const db = JSON.parse(originalDb);
    if (db.profiles && db.profiles.length > 0) {
      db.profiles[0].settings.smsPhone = '+14155550192';
      db.profiles[0].settings.smsConsent = true;
    }
    if (db.phone_lines && db.phone_lines.length > 0) {
      if (!db.phone_lines[0].settings.extraSettings) {
        db.phone_lines[0].settings.extraSettings = {};
      }
      db.phone_lines[0].settings.extraSettings.notifSMS = true;
      db.phone_lines[0].settings.extraSettings.notifMissed = true;
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('✅ Local mock database pre-configured.');

    // 2. Trigger Twilio voicemail transcription webhook callback
    console.log('📞 Simulating Twilio voicemail webhook callback with SMS enabled...');
    const webhookData = 'CallSid=CA_TEST_SMS_123' +
      '&From=%2B14155550192&RecordingUrl=https%3A%2F%2Fapi.twilio.com%2F2010&RecordingDuration=15&TranscriptionText=Hello%20this%20is%20a%20test%20transcription%20for%20SMS%20notification';
    
    // Invalidate local memory cache in NextJS process by sending line settings update
    // Let's log in to update the cached line object
    console.log('🔑 Logging in as support@icancall.co...');
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/otp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'verify', email: 'support@icancall.co', token: '123456' });

    const cookies = loginRes.headers['set-cookie'] || [];
    const sessionCookie = cookies.find(c => c.startsWith('session='));
    if (!sessionCookie) {
      console.log('⚠️ Login response headers:', loginRes.headers);
      console.error('❌ Login failed: No session cookie returned.');
      process.exit(1);
    }
    const cookieVal = sessionCookie.split(';')[0];

    // Fetch lines to ensure memory cache matches local_db.json
    console.log('🔄 Fetching lines (clears/updates internal cache from file)...');
    await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/caregiver/lines',
      method: 'GET',
      headers: { 'Cookie': cookieVal }
    });

    const webhookRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/twilio/transcription?To=%2B15005550006`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(webhookData)
      }
    }, webhookData);

    console.log(`STATUS: ${webhookRes.statusCode}`);
    console.log(`RESPONSE: ${JSON.stringify(webhookRes.body)}`);

    if (webhookRes.statusCode === 200 && webhookRes.body.success) {
      console.log('✅ Success! Webhook responded with success.');
    } else {
      console.log('❌ Failed: Webhook returned error response.');
    }

  } finally {
    // Restore original db state
    console.log('🔄 Restoring original local_db.json state...');
    fs.writeFileSync(dbPath, originalDb, 'utf8');
  }
}

run().catch(err => {
  console.error('❌ Test execution error:', err);
});
