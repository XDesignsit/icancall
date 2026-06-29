import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isMock = !supabaseUrl || !supabaseServiceKey || supabaseUrl === 'placeholder-url' || supabaseServiceKey === 'placeholder-key';

if (isMock) {
  console.warn(
    'Warning: Missing or placeholder Supabase environment variables. Bypassing database and running local mock client (saving state in scratch/local_db.json).'
  );
}

class MockSupabaseClient {
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'scratch', 'local_db.json');
    this.ensureDbExists();
  }

  private ensureDbExists() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify({ profiles: [], phone_lines: [] }, null, 2), 'utf8');
    }
  }

  private readDb() {
    this.ensureDbExists();
    try {
      return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
    } catch {
      return { profiles: [], phone_lines: [] };
    }
  }

  private writeDb(data: any) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
  }

  auth = {
    signInWithOtp: async ({ email }: { email: string }) => {
      console.log(`[MOCK] signInWithOtp for ${email}`);
      return { data: {}, error: null };
    },
    verifyOtp: async ({ email }: { email: string }) => {
      console.log(`[MOCK] verifyOtp for ${email}`);
      const userId = `mock-user-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
      return { data: { user: { id: userId, email } }, error: null };
    },
    signUp: async ({ email }: { email: string }) => {
      console.log(`[MOCK] signUp for ${email}`);
      const userId = `mock-user-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
      return { data: { user: { id: userId, email } }, error: null };
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      console.log(`[MOCK] signInWithPassword for ${email}`);
      const userId = `mock-user-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
      return { data: { user: { id: userId, email } }, error: null };
    },
    admin: {
      listUsers: async () => {
        const db = this.readDb();
        const users = db.profiles.map((p: any) => ({ id: p.id, email: p.email }));
        return { data: { users }, error: null };
      },
      createUser: async ({ email }: { email: string }) => {
        const userId = `mock-user-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
        return { data: { user: { id: userId, email } }, error: null };
      }
    }
  };

  storage = {
    from: (bucket: string) => ({
      upload: async (filePath: string, fileBody: any) => {
        console.log(`[MOCK] Storage upload to ${bucket}/${filePath}`);
        return { data: { path: filePath }, error: null };
      },
      getPublicUrl: (filePath: string) => {
        return { data: { publicUrl: `https://mock-storage.icancall.co/${bucket}/${filePath}` } };
      }
    })
  };

  from(table: string) {
    const db = this.readDb();
    if (!db[table]) {
      db[table] = [];
    }

    let currentData = [...db[table]];

    const builder = {
      select: (columns: string = '*') => {
        return builder;
      },
      eq: (column: string, value: any) => {
        currentData = currentData.filter((item: any) => item[column] === value);
        return builder;
      },
      not: (column: string, operator: string, value: string) => {
        if (operator === 'in') {
          const ids = value.replace(/[()']/g, '').split(',').map(s => s.trim());
          currentData = currentData.filter((item: any) => !ids.includes(item[column]));
        }
        return builder;
      },
      maybeSingle: async () => {
        return { data: currentData[0] || null, error: null };
      },
      single: async () => {
        return { data: currentData[0] || null, error: currentData[0] ? null : new Error("No row found") };
      },
      insert: async (rowOrRows: any) => {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const added: any[] = [];
        rows.forEach((r: any) => {
          const newRow = { ...r };
          if (!newRow.id) {
            newRow.id = `mock-row-${Math.random().toString(36).substring(2, 11)}`;
          }
          db[table].push(newRow);
          added.push(newRow);
        });
        this.writeDb(db);
        currentData = added;
        return builder;
      },
      update: async (updates: any) => {
        const updatedIds = currentData.map((item: any) => item.id);
        db[table] = db[table].map((item: any) => {
          if (updatedIds.includes(item.id)) {
            const updatedItem = { ...item, ...updates, updated_at: new Date().toISOString() };
            currentData = currentData.map((cd: any) => cd.id === item.id ? updatedItem : cd);
            return updatedItem;
          }
          return item;
        });
        this.writeDb(db);
        return builder;
      },
      upsert: async (rowOrRows: any) => {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const upserted: any[] = [];
        rows.forEach((r: any) => {
          let existingIdx = -1;
          if (r.id) {
            existingIdx = db[table].findIndex((item: any) => item.id === r.id);
          } else if (r.user_id && r.number) {
            existingIdx = db[table].findIndex((item: any) => item.user_id === r.user_id && item.number === r.number);
          }

          const targetRow = { ...r };
          if (!targetRow.id) {
            targetRow.id = `mock-row-${Math.random().toString(36).substring(2, 11)}`;
          }

          if (existingIdx > -1) {
            db[table][existingIdx] = { ...db[table][existingIdx], ...targetRow };
            upserted.push(db[table][existingIdx]);
          } else {
            db[table].push(targetRow);
            upserted.push(targetRow);
          }
        });
        this.writeDb(db);
        currentData = upserted;
        return builder;
      },
      delete: () => {
        const idsToDelete = currentData.map((item: any) => item.id);
        db[table] = db[table].filter((item: any) => !idsToDelete.includes(item.id));
        this.writeDb(db);
        return builder;
      },
      then: (onfulfilled?: (value: any) => any) => {
        const promise = Promise.resolve({ data: currentData, error: null });
        return promise.then(onfulfilled);
      }
    };

    return builder;
  }
}

export const supabase = isMock
  ? (new MockSupabaseClient() as any)
  : createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );
