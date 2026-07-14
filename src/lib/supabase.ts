import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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

type MockRow = Record<string, unknown>;
type MockDb = Record<string, MockRow[]>;
type MockResult = { data: MockRow[]; error: Error | null };

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

  private readDb(): MockDb {
    this.ensureDbExists();
    try {
      return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
    } catch {
      return { profiles: [], phone_lines: [] };
    }
  }

  private writeDb(data: MockDb) {
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
        const users = db.profiles.map((p) => ({ id: p.id, email: p.email }));
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
      upload: async (filePath: string, _fileBody: unknown) => {
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

    let action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
    let actionPayload: MockRow | MockRow[] | null = null;
    const filters: { type: 'eq' | 'not'; column: string; value: unknown; operator?: string }[] = [];

    const builder = {
      select: (_columns: string = '*') => {
        if (action !== 'insert' && action !== 'update' && action !== 'upsert' && action !== 'delete') {
          action = 'select';
        }
        return builder;
      },
      eq: (column: string, value: unknown) => {
        filters.push({ type: 'eq', column, value });
        return builder;
      },
      not: (column: string, operator: string, value: string) => {
        filters.push({ type: 'not', column, value, operator });
        return builder;
      },
      insert: (rowOrRows: MockRow | MockRow[]) => {
        action = 'insert';
        actionPayload = rowOrRows;
        return builder;
      },
      update: (updates: MockRow) => {
        action = 'update';
        actionPayload = updates;
        return builder;
      },
      upsert: (rowOrRows: MockRow | MockRow[]) => {
        action = 'upsert';
        actionPayload = rowOrRows;
        return builder;
      },
      delete: () => {
        action = 'delete';
        return builder;
      },

      execute: (): MockResult => {
        let data = [...db[table]];

        // 1. Apply filters
        filters.forEach(f => {
          if (f.type === 'eq') {
            data = data.filter((item) => item[f.column] === f.value);
          } else if (f.type === 'not' && f.operator === 'in') {
            const ids = String(f.value).replace(/[()']/g, '').split(',').map((s) => s.trim());
            data = data.filter((item) => !ids.includes(String(item[f.column])));
          }
        });

        // 2. Perform action
        if (action === 'insert') {
          const rows = Array.isArray(actionPayload) ? actionPayload : [actionPayload || {}];
          const added: MockRow[] = [];
          rows.forEach((r) => {
            const newRow = { ...r };
            if (!newRow.id) {
              newRow.id = `mock-row-${Math.random().toString(36).substring(2, 11)}`;
            }
            db[table].push(newRow);
            added.push(newRow);
          });
          this.writeDb(db);
          return { data: added, error: null };
        }

        if (action === 'update') {
          const matchingIds = data.map((item) => item.id);
          db[table] = db[table].map((item) => {
            if (matchingIds.includes(item.id)) {
              return { ...item, ...actionPayload, updated_at: new Date().toISOString() };
            }
            return item;
          });
          this.writeDb(db);
          const updated = db[table].filter((item) => matchingIds.includes(item.id));
          return { data: updated, error: null };
        }

        if (action === 'upsert') {
          const rows = Array.isArray(actionPayload) ? actionPayload : [actionPayload || {}];
          const upserted: MockRow[] = [];
          rows.forEach((r) => {
            let existingIdx = -1;
            if (r.id) {
              existingIdx = db[table].findIndex((item) => item.id === r.id);
            } else if (r.user_id && r.number) {
              existingIdx = db[table].findIndex((item) => item.user_id === r.user_id && item.number === r.number);
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
          return { data: upserted, error: null };
        }

        if (action === 'delete') {
          const matchingIds = data.map((item) => item.id);
          db[table] = db[table].filter((item) => !matchingIds.includes(item.id));
          this.writeDb(db);
          return { data, error: null };
        }

        return { data, error: null };
      },

      maybeSingle: async () => {
        const { data, error } = builder.execute();
        return { data: data ? data[0] || null : null, error };
      },
      single: async () => {
        const { data, error } = builder.execute();
        return { data: data ? data[0] || null : null, error: data && data[0] ? null : (error || new Error("No row found")) };
      },
      then: (onfulfilled?: (value: MockResult) => unknown) => {
        const promise = Promise.resolve(builder.execute());
        return promise.then(onfulfilled);
      }
    };

    return builder;
  }
}

export const supabase = isMock
  ? (new MockSupabaseClient() as unknown as SupabaseClient)
  : createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );
