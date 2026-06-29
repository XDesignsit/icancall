const http = require('http');

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
  console.log('🚀 Starting end-to-end voicemail notification toggle test...');

  // 1. Login to get session cookie
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
    console.error('❌ Login failed: No session cookie returned.');
    process.exit(1);
  }
  const cookieVal = sessionCookie.split(';')[0];

  // 2. Fetch current lines
  console.log('📞 Fetching current lines...');
  const linesRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/caregiver/lines',
    method: 'GET',
    headers: { 'Cookie': cookieVal }
  });

  const rawLines = linesRes.body.lines;
  if (!rawLines || rawLines.length === 0) {
    console.error('❌ Failed to fetch lines or no lines found.');
    process.exit(1);
  }

  const rawLine = rawLines[0];
  console.log(`ℹ️ Found raw database line: ${rawLine.number} (${rawLine.name})`);

  // Map to frontend shape
  const dbSettings = rawLine.settings || {};
  const testLineFrontend = {
    id: rawLine.id,
    number: rawLine.number,
    label: rawLine.name,
    person: rawLine.type,
    contacts: rawLine.contacts || [],
    color: dbSettings.color || "oklch(0.58 0.115 232)",
    mode: dbSettings.mode || "menu",
    minutesUsed: dbSettings.minutesUsed || 0,
    schedule: dbSettings.schedule || [],
    settings: dbSettings.extraSettings || {}
  };

  async function setToggleAndTest(enabled) {
    console.log(`\n--- Setting Missed Call Notifications = ${enabled} ---`);
    
    // Update settings object in frontend shape
    testLineFrontend.settings = {
      ...testLineFrontend.settings,
      notifMissed: enabled
    };

    // 3. Save the lines back
    console.log('💾 Saving lines settings (this invalidates cache)...');
    const saveRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/caregiver/lines',
      method: 'POST',
      headers: {
        'Cookie': cookieVal,
        'Content-Type': 'application/json'
      }
    }, { lines: [testLineFrontend] });

    console.log(`💾 Save Status: ${saveRes.statusCode}`);
    console.log(`💾 Save Response: ${JSON.stringify(saveRes.body)}`);

    // 4. Trigger Twilio webhook to test voicemail dispatch
    console.log('📞 Simulating Twilio voicemail webhook callback...');
    const webhookData = 'CallSid=CA_TEST_' + Math.random().toString(36).substring(2, 6) + 
      '&From=%2B14155550192&RecordingUrl=https%3A%2F%2Fapi.twilio.com%2F2010&RecordingDuration=15&TranscriptionText=Hello%20this%20is%20a%20test%20transcription';
    
    const webhookRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/twilio/transcription?To=${encodeURIComponent(testLineFrontend.number)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(webhookData)
      }
    }, webhookData);

    console.log(`STATUS: ${webhookRes.statusCode}`);
    console.log(`RESPONSE: ${JSON.stringify(webhookRes.body)}`);
    return webhookRes.body;
  }

  // Run both toggles
  const disabledRes = await setToggleAndTest(false);
  const enabledRes = await setToggleAndTest(true);
  
  console.log('\n✅ End-to-end verification complete!');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
});
