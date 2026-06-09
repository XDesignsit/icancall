import fs from 'fs';
import path from 'path';

export interface Account {
  id: string;
  name: string;
  twilioPhoneNumber: string;
  allotted_minutes: number;
  purchased_minutes: number;
  used_minutes: number;
}

const DB_FILE = path.join(process.cwd(), 'scratch', 'db.json');

// Helper to ensure the database file and directories exist
function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    // Seed database with a default test account matching the Twilio test number
    const initialData: Account[] = [
      {
        id: 'user_1',
        name: 'John Doe',
        twilioPhoneNumber: '+15005550006', // Magic Twilio test number
        allotted_minutes: 30,
        purchased_minutes: 10,
        used_minutes: 0
      }
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// Read accounts from JSON file
export function readAccounts(): Account[] {
  ensureDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read mock DB:', error);
    return [];
  }
}

// Write accounts back to JSON file
export function writeAccounts(accounts: Account[]) {
  ensureDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(accounts, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to write mock DB:', error);
  }
}

// Find an account by their Twilio phone number
export function findAccountByTwilioNumber(phoneNumber: string): Account | undefined {
  const accounts = readAccounts();
  // Normalize phone numbers to facilitate match (optional, but good practice)
  const normalizedSearch = phoneNumber.replace(/\s+/g, '');
  return accounts.find(
    (acc) => acc.twilioPhoneNumber.replace(/\s+/g, '') === normalizedSearch
  );
}

// Deduct minutes consumed by a call
export function deductMinutes(twilioPhoneNumber: string, minutes: number): Account | null {
  const accounts = readAccounts();
  const normalizedSearch = twilioPhoneNumber.replace(/\s+/g, '');
  const accIndex = accounts.findIndex(
    (acc) => acc.twilioPhoneNumber.replace(/\s+/g, '') === normalizedSearch
  );

  if (accIndex === -1) {
    return null;
  }

  accounts[accIndex].used_minutes += minutes;
  writeAccounts(accounts);
  return accounts[accIndex];
}

// Check available minutes
export function getAvailableMinutes(account: Account): number {
  return (account.allotted_minutes + account.purchased_minutes) - account.used_minutes;
}
