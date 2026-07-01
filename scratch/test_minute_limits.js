import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'db.json');

// Helper to reset and write mock data for the test
function seedTestUser(usedMinutes) {
  const testData = [
    {
      id: 'user_1',
      name: 'John Doe',
      twilioPhoneNumber: '+15005550006',
      allotted_minutes: 30,
      purchased_minutes: 10,
      used_minutes: usedMinutes
    }
  ];
  fs.writeFileSync(DB_FILE, JSON.stringify(testData, null, 2), 'utf8');
}

// Load the DB modules
import * as db from '../src/lib/db.ts';
console.log('🧪 Starting Twilio voice minute limits integration tests...\n');

// Reset DB with 40 total available minutes (0 used)
seedTestUser(0);
console.log('1. Database initialized with 40 available minutes.');

// Import Next.js route handlers
import { POST as voicePOST } from '../src/app/api/twilio/voice/route.ts';
import { POST as completedPOST } from '../src/app/api/twilio/voice-completed/route.ts';

async function runTests() {
  // Mock request helper
  async function mockVoiceRequest(digits, to) {
    const params = [];
    if (digits) params.push(`Digits=${digits}`);
    if (to) params.push(`To=${encodeURIComponent(to)}`);
    const url = `http://localhost:3000/api/twilio/voice${params.length ? '?' + params.join('&') : ''}`;
    
    // Simulate Request object
    const req = {
      method: 'POST',
      url,
      headers: {
        get: () => 'application/x-www-form-urlencoded'
      },
      formData: async () => {
        const data = new Map();
        if (digits) data.set('Digits', digits);
        if (to) data.set('To', to);
        return data;
      }
    };

    const res = await voicePOST(req);
    return await res.text();
  }

  // Mock voice completed request helper
  async function mockCompletedRequest(duration, to) {
    const url = `http://localhost:3000/api/twilio/voice-completed?To=${encodeURIComponent(to)}`;
    
    const req = {
      method: 'POST',
      url,
      headers: {
        get: () => 'application/x-www-form-urlencoded'
      },
      formData: async () => {
        const data = new Map();
        if (duration) data.set('DialCallDuration', duration.toString());
        if (to) data.set('To', to);
        return data;
      }
    };

    const res = await completedPOST(req);
    return await res.text();
  }

  // --- TEST 2: Active Balance Greeting ---
  const res1 = await mockVoiceRequest(null, '+15005550006');
  if (res1.includes('priority line') && !res1.includes('run out of voice minutes')) {
    console.log('✅ Test 2 Passed: Inbound call allowed with active minutes.');
  } else {
    console.error('❌ Test 2 Failed: Unexpected TwiML output:', res1);
  }

  // --- TEST 3: Cascade Dial sets timeLimit dynamically ---
  const res2 = await mockVoiceRequest('1', '+15005550006');
  if (res2.includes('timeLimit="2400"')) {
    console.log('✅ Test 3 Passed: Correct TwiML timeLimit set (2400 seconds / 40 mins).');
  } else {
    console.error('❌ Test 3 Failed: timeLimit missing or incorrect:', res2);
  }

  // --- TEST 4: Post-call completion callback minute deduction ---
  console.log('Simulating call completion of 145 seconds (rounds up to 3 mins)...');
  await mockCompletedRequest(145, '+15005550006');
  
  const accounts = db.readAccounts();
  const acc = accounts[0];
  if (acc.used_minutes === 3) {
    console.log(`✅ Test 4 Passed: Consumed minutes correctly deducted. Used mins is 3.`);
  } else {
    console.error('❌ Test 4 Failed: used_minutes was not updated correctly:', acc);
  }

  // --- TEST 5: Exhausted balance locks call ---
  console.log('Setting user used_minutes to 40 (balance = 0)...');
  seedTestUser(40);

  const res3 = await mockVoiceRequest(null, '+15005550006');
  if (res3.includes('run out of voice minutes') && res3.includes('<Hangup />')) {
    console.log('✅ Test 5 Passed: Exhausted balance successfully blocks call.');
  } else {
    console.error('❌ Test 5 Failed: Exhausted call not blocked as expected:', res3);
  }
}

runTests().catch(console.error);
