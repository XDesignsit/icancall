/* iCanCall — Super Admin console · demo data
   Early-stage SaaS (hundreds of accounts). Numbers are internally consistent:
   Essential $12.99/mo ($129/yr → $10.75 MRR) · Pro $19.99/mo ($199/yr → $16.58 MRR)
   ----------------------------------------------------------------------------- */

const fmtUSD = (n, dp = 0) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const fmtNum = (n) => Number(n).toLocaleString('en-US');

const MONTHS = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];

/* ---- Top-line aggregates ---- */
const KPI = {
  mrr: 9847,
  mrrPrev: 9082,
  arr: 118164,
  accounts: 487,
  accountsNew: 44,
  accountsPrev: 455,
  activeNumbers: 712,
  churnLogo: 2.1,              // % monthly logo churn
  nrr: 104,                    // net revenue retention %
  arpa: 22.85,                 // avg revenue per account (paying)
  ltv: 412,
};

/* ---- 12-month series ---- */
const MRR_SERIES     = [4180, 4620, 5050, 5380, 5910, 6340, 6880, 7390, 7920, 8510, 9180, 9847];
const SIGNUP_SERIES  = [21, 24, 22, 28, 26, 31, 29, 34, 33, 38, 41, 44];
const CHURN_SERIES   = [3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 9]; // accounts churned / mo
const ACCOUNTS_SERIES= [188, 210, 228, 253, 274, 301, 324, 353, 379, 411, 448, 487];

/* ---- Plan distribution (paying base), each split by billing cycle ----
   plan count/mrr equal the sum of their monthly + annual segments. */
const PLAN_SPLIT = [
  { id: 'pro', name: 'Pro', count: 201, mrr: 5667, color: 'var(--blue)',
    billing: [
      { id: 'monthly', label: 'Monthly', count: 118, mrr: 3540, color: 'var(--blue)' },
      { id: 'annual',  label: 'Annual',  count: 83,  mrr: 2127, color: 'oklch(0.72 0.08 232)' },
    ] },
  { id: 'essential', name: 'Essential', count: 286, mrr: 4180, color: 'var(--teal-deep)',
    billing: [
      { id: 'monthly', label: 'Monthly', count: 191, mrr: 2890, color: 'var(--teal-deep)' },
      { id: 'annual',  label: 'Annual',  count: 95,  mrr: 1290, color: 'oklch(0.79 0.07 196)' },
    ] },
];
/* flattened 4-way segments (Pro Monthly, Pro Annual, Essential Monthly, Essential Annual) */
const PLAN_BILLING_BY_COUNT = PLAN_SPLIT.flatMap((p) => p.billing.map((b) => ({ count: b.count, color: b.color })));
const PLAN_BILLING_BY_MRR   = PLAN_SPLIT.flatMap((p) => p.billing.map((b) => ({ count: b.mrr, color: b.color })));

/* ---- Account status breakdown ---- */
const STATUS_SPLIT = [
  { id: 'active',   label: 'Active',   count: 470, kind: 'green' },
  { id: 'past_due', label: 'Past due', count: 12,  kind: 'amber' },
  { id: 'suspended',label: 'Suspended',count: 5,   kind: 'rose'  },
];

/* ---- MRR movement (this month) ---- */
const MRR_MOVEMENT = [
  { label: 'New business',  amt: 1024, kind: 'pos' },
  { label: 'Expansion',     amt: 388,  kind: 'pos' },
  { label: 'Reactivation',  amt: 96,   kind: 'pos' },
  { label: 'Contraction',   amt: -214, kind: 'neg' },
  { label: 'Churn',         amt: -529, kind: 'neg' },
];

/* ---- Feature adoption (the features the user asked us to track) ---- */
const FEATURES = {
  routing: [
    { id: 'menu',    label: 'Caller Menu', pct: 58, color: 'var(--blue)' },
    { id: 'cascade', label: 'Cascade',     pct: 42, color: 'var(--violet)' },
  ],
  voicemailEnabledPct: 71,     // % of lines with voicemail fallback on
  voicemailOfCallsPct: 5.8,    // % of calls ending in voicemail
  avgContacts: 4.3,            // avg trusted contacts per circle
  contactsDist: [              // histogram of contacts per circle
    { n: '1', pct: 6 }, { n: '2', pct: 11 }, { n: '3', pct: 22 },
    { n: '4', pct: 24 }, { n: '5', pct: 19 }, { n: '6', pct: 18 },
  ],
};

/* ---- Reliability / system health ---- */
const HEALTH = {
  uptime: 99.98,
  connectRate: 94.2,
  voicemailRate: 5.8,
  missedAlertRate: 99.1,       // % of missed calls that triggered an alert
  avgRingMs: 2.4,              // seconds to first connect
  callsLast30: 18420,
  callVolume: [               // last 14 days, calls/day
    520, 548, 612, 590, 634, 470, 410, 560, 598, 640, 612, 668, 590, 512,
  ],
  connectTrend: [93.1, 93.6, 94.0, 92.8, 94.4, 95.1, 94.2],
  incidents: [
    { id: 1, sev: 'resolved', title: 'Carrier latency — (305) Miami pool', detail: 'Elevated ring times on 41 numbers', when: 'May 22 · 14m', kind: 'amber' },
    { id: 2, sev: 'resolved', title: 'Voicemail transcription delay', detail: 'Backlog cleared, no calls dropped', when: 'May 14 · 38m', kind: 'amber' },
    { id: 3, sev: 'resolved', title: 'SMS alert provider failover', detail: 'Auto-failover to secondary route', when: 'Apr 30 · 6m', kind: 'green' },
  ],
  regions: [
    { code: '415', city: 'San Francisco', numbers: 168, connect: 95.1 },
    { code: '212', city: 'New York',       numbers: 142, connect: 94.6 },
    { code: '312', city: 'Chicago',        numbers: 96,  connect: 93.8 },
    { code: '305', city: 'Miami',          numbers: 88,  connect: 92.4 },
    { code: '206', city: 'Seattle',        numbers: 74,  connect: 95.3 },
    { code: '617', city: 'Boston',         numbers: 61,  connect: 94.9 },
  ],
};

/* ---- Accounts (representative page of the 487) ----
   mrr is the monthly-recognized revenue for that account.  */
const AC = (o) => o;
const ACCOUNTS = [
  AC({ id: 'ACC-2041', owner: 'Maria Delgado',  email: 'maria.delgado@gmail.com', color: 'oklch(0.55 0.13 285)',
       plan: 'pro', billing: 'annual', status: 'active', joined: 'Nov 2, 2024', last: '8m ago',
       city: 'San Francisco', area: '415', numbers: 2, contacts: 8, calls30: 142, connect: 95.1, vmRate: 4.2,
       minutesUsed: 49, minutesCap: 120, mrr: 16.58, ltv: 298, next: 'Nov 2, 2025', isHero: true,
       lines: [
         { label: "Eleanor's line", person: 'Eleanor Delgado · Mom', number: '(415) 555-0142', mode: 'menu',    minutesUsed: 38, contacts: 5 },
         { label: "Robert's line",  person: 'Robert Hale · Dad',     number: '(415) 555-0188', mode: 'cascade', minutesUsed: 11, contacts: 3 },
       ] }),
  AC({ id: 'ACC-2038', owner: 'Daniel Okonkwo', email: 'd.okonkwo@outlook.com', color: 'oklch(0.58 0.115 232)',
       plan: 'pro', billing: 'monthly', status: 'active', joined: 'Oct 19, 2024', last: '2h ago',
       city: 'Chicago', area: '312', numbers: 2, contacts: 9, calls30: 96, connect: 93.4, vmRate: 6.1,
       minutesUsed: 71, minutesCap: 120, mrr: 19.99, ltv: 188, next: 'Jun 19, 2025',
       lines: [
         { label: "Grace's line",  person: 'Grace Okonkwo · Mother', number: '(312) 555-0177', mode: 'menu',    minutesUsed: 44, contacts: 6 },
         { label: "Joseph's line", person: 'Joseph Okonkwo · Uncle', number: '(312) 555-0204', mode: 'cascade', minutesUsed: 27, contacts: 3 },
       ] }),
  AC({ id: 'ACC-2035', owner: 'Priya Nair',     email: 'priya.nair@gmail.com', color: 'oklch(0.6 0.14 350)',
       plan: 'essential', billing: 'monthly', status: 'active', joined: 'Oct 11, 2024', last: '1d ago',
       city: 'New York', area: '212', numbers: 1, contacts: 3, calls30: 54, connect: 96.0, vmRate: 3.1,
       minutesUsed: 22, minutesCap: 30, mrr: 12.99, ltv: 104, next: 'Jun 11, 2025',
       lines: [{ label: "Asha's line", person: 'Asha Nair · Grandmother', number: '(212) 555-0166', mode: 'menu', minutesUsed: 22, contacts: 3 }] }),
  AC({ id: 'ACC-2033', owner: 'Robert Chen',    email: 'rchen.family@gmail.com', color: 'oklch(0.62 0.10 198)',
       plan: 'pro', billing: 'annual', status: 'active', joined: 'Sep 28, 2024', last: '4h ago',
       city: 'Seattle', area: '206', numbers: 2, contacts: 7, calls30: 88, connect: 95.7, vmRate: 4.8,
       minutesUsed: 58, minutesCap: 120, mrr: 16.58, ltv: 232, next: 'Sep 28, 2025',
       lines: [
         { label: "Wei's line",  person: 'Wei Chen · Father', number: '(206) 555-0143', mode: 'cascade', minutesUsed: 33, contacts: 4 },
         { label: "Mei's line",  person: 'Mei Chen · Mother', number: '(206) 555-0151', mode: 'menu',    minutesUsed: 25, contacts: 3 },
       ] }),
  AC({ id: 'ACC-2030', owner: 'Sofia Martinez', email: 'sofia.m@icloud.com', color: 'oklch(0.60 0.13 30)',
       plan: 'essential', billing: 'annual', status: 'active', joined: 'Sep 14, 2024', last: '3d ago',
       city: 'Miami', area: '305', numbers: 1, contacts: 4, calls30: 41, connect: 92.4, vmRate: 7.0,
       minutesUsed: 19, minutesCap: 30, mrr: 10.75, ltv: 129, next: 'Sep 14, 2025',
       lines: [{ label: "Carmen's line", person: 'Carmen Ruiz · Aunt', number: '(305) 555-0188', mode: 'menu', minutesUsed: 19, contacts: 4 }] }),
  AC({ id: 'ACC-2029', owner: 'James Patel',    email: 'james.patel@gmail.com', color: 'oklch(0.58 0.13 145)',
       plan: 'pro', billing: 'monthly', status: 'past_due', joined: 'Sep 6, 2024', last: '6d ago',
       city: 'Boston', area: '617', numbers: 2, contacts: 6, calls30: 33, connect: 90.1, vmRate: 9.2,
       minutesUsed: 64, minutesCap: 120, mrr: 19.99, ltv: 160, next: 'Overdue · May 6',
       lines: [
         { label: "Nana's line",  person: 'Vimala Patel · Grandmother', number: '(617) 555-0122', mode: 'cascade', minutesUsed: 40, contacts: 4 },
         { label: "Papa's line",  person: 'Arun Patel · Grandfather',   number: '(617) 555-0139', mode: 'menu',    minutesUsed: 24, contacts: 2 },
       ] }),
  AC({ id: 'ACC-2027', owner: 'Hannah Weiss',   email: 'hannah.weiss@gmail.com', color: 'oklch(0.55 0.13 285)',
       plan: 'essential', billing: 'monthly', status: 'active', joined: 'May 24, 2025', last: '20m ago',
       city: 'New York', area: '212', numbers: 1, contacts: 2, calls30: 14, connect: 97.0, vmRate: 2.1,
       minutesUsed: 6, minutesCap: 30, mrr: 12.99, ltv: 13, next: 'Jun 24, 2025',
       lines: [{ label: "Opa's line", person: 'Karl Weiss · Father', number: '(212) 555-0210', mode: 'cascade', minutesUsed: 3, contacts: 2 }] }),
  AC({ id: 'ACC-2025', owner: 'Tomás Rivera',   email: 't.rivera@protonmail.com', color: 'oklch(0.58 0.115 232)',
       plan: 'essential', billing: 'monthly', status: 'active', joined: 'Aug 30, 2024', last: '5h ago',
       city: 'Miami', area: '305', numbers: 1, contacts: 5, calls30: 47, connect: 93.0, vmRate: 6.4,
       minutesUsed: 26, minutesCap: 30, mrr: 12.99, ltv: 117, next: 'Jun 30, 2025',
       lines: [{ label: "Abuela's line", person: 'Rosa Rivera · Grandmother', number: '(305) 555-0144', mode: 'menu', minutesUsed: 26, contacts: 5 }] }),
  AC({ id: 'ACC-2022', owner: 'Linda Thompson', email: 'lthompson@yahoo.com', color: 'oklch(0.6 0.14 350)',
       plan: 'pro', billing: 'annual', status: 'active', joined: 'Aug 12, 2024', last: '1d ago',
       city: 'Chicago', area: '312', numbers: 2, contacts: 8, calls30: 73, connect: 94.8, vmRate: 5.0,
       minutesUsed: 52, minutesCap: 120, mrr: 16.58, ltv: 245, next: 'Aug 12, 2025',
       lines: [
         { label: "Mom's line",  person: 'Dorothy Hale · Mother', number: '(312) 555-0190', mode: 'menu',    minutesUsed: 31, contacts: 5 },
         { label: "Dad's line",  person: 'Earl Hale · Father',    number: '(312) 555-0198', mode: 'cascade', minutesUsed: 21, contacts: 3 },
       ] }),
  AC({ id: 'ACC-2019', owner: 'Kevin O\u2019Brien', email: 'kobrien.care@gmail.com', color: 'oklch(0.62 0.10 198)',
       plan: 'essential', billing: 'monthly', status: 'active', joined: 'Jul 27, 2024', last: '2d ago',
       city: 'Boston', area: '617', numbers: 1, contacts: 3, calls30: 38, connect: 95.5, vmRate: 3.8,
       minutesUsed: 17, minutesCap: 30, mrr: 12.99, ltv: 130, next: 'Jun 27, 2025',
       lines: [{ label: "Da's line", person: 'Sean O\u2019Brien · Father', number: '(617) 555-0177', mode: 'cascade', minutesUsed: 17, contacts: 3 }] }),
  AC({ id: 'ACC-2016', owner: 'Aisha Bello',    email: 'aisha.bello@gmail.com', color: 'oklch(0.60 0.13 30)',
       plan: 'pro', billing: 'monthly', status: 'active', joined: 'Jul 9, 2024', last: '9h ago',
       city: 'New York', area: '212', numbers: 2, contacts: 10, calls30: 110, connect: 96.2, vmRate: 3.4,
       minutesUsed: 83, minutesCap: 120, mrr: 19.99, ltv: 210, next: 'Jun 9, 2025',
       lines: [
         { label: "Mama's line",  person: 'Fatima Bello · Mother',    number: '(212) 555-0220', mode: 'menu',    minutesUsed: 49, contacts: 6 },
         { label: "Baba's line",  person: 'Ibrahim Bello · Father',   number: '(212) 555-0231', mode: 'menu',    minutesUsed: 34, contacts: 4 },
       ] }),
  AC({ id: 'ACC-2012', owner: 'Grace Kim',      email: 'grace.kim@icloud.com', color: 'oklch(0.58 0.13 145)',
       plan: 'essential', billing: 'annual', status: 'active', joined: 'Jun 21, 2024', last: '4d ago',
       city: 'Seattle', area: '206', numbers: 1, contacts: 4, calls30: 29, connect: 94.0, vmRate: 5.5,
       minutesUsed: 14, minutesCap: 30, mrr: 10.75, ltv: 118, next: 'Jun 21, 2025',
       lines: [{ label: "Halmoni's line", person: 'Soo-ja Kim · Grandmother', number: '(206) 555-0162', mode: 'menu', minutesUsed: 14, contacts: 4 }] }),
  AC({ id: 'ACC-2008', owner: 'Marcus Webb',    email: 'marcus.webb@gmail.com', color: 'oklch(0.55 0.13 285)',
       plan: 'pro', billing: 'monthly', status: 'suspended', joined: 'Jun 3, 2024', last: '34d ago',
       city: 'Chicago', area: '312', numbers: 2, contacts: 5, calls30: 0, connect: 0, vmRate: 0,
       minutesUsed: 0, minutesCap: 120, mrr: 0, ltv: 140, next: 'Suspended',
       lines: [
         { label: "Pop's line",  person: 'Cliff Webb · Father', number: '(312) 555-0241', mode: 'cascade', minutesUsed: 0, contacts: 3 },
         { label: "Gran's line", person: 'Ada Webb · Grandmother', number: '(312) 555-0250', mode: 'menu',  minutesUsed: 0, contacts: 2 },
       ] }),
  AC({ id: 'ACC-2005', owner: 'Elena Popov',    email: 'elena.popov@gmail.com', color: 'oklch(0.62 0.10 198)',
       plan: 'essential', billing: 'monthly', status: 'active', joined: 'May 26, 2025', last: '1h ago',
       city: 'Boston', area: '617', numbers: 1, contacts: 3, calls30: 11, connect: 96.5, vmRate: 1.8,
       minutesUsed: 5, minutesCap: 30, mrr: 12.99, ltv: 13, next: 'Jun 26, 2025',
       lines: [{ label: "Babushka's line", person: 'Irina Popov · Grandmother', number: '(617) 555-0188', mode: 'menu', minutesUsed: 5, contacts: 3 }] }),
  AC({ id: 'ACC-2001', owner: 'David Aguilar',  email: 'd.aguilar@outlook.com', color: 'oklch(0.60 0.13 30)',
       plan: 'pro', billing: 'annual', status: 'active', joined: 'May 8, 2024', last: '6h ago',
       city: 'Miami', area: '305', numbers: 2, contacts: 7, calls30: 64, connect: 93.6, vmRate: 6.0,
       minutesUsed: 47, minutesCap: 120, mrr: 16.58, ltv: 252, next: 'May 8, 2025',
       lines: [
         { label: "Madre's line", person: 'Lucia Aguilar · Mother', number: '(305) 555-0199', mode: 'menu',    minutesUsed: 28, contacts: 4 },
         { label: "Padre's line", person: 'Hector Aguilar · Father', number: '(305) 555-0207', mode: 'cascade', minutesUsed: 19, contacts: 3 },
       ] }),
  AC({ id: 'ACC-1998', owner: 'Nadia Rahman',   email: 'nadia.rahman@gmail.com', color: 'oklch(0.6 0.14 350)',
       plan: 'essential', billing: 'monthly', status: 'canceled', joined: 'Apr 30, 2024', last: '12d ago',
       city: 'Seattle', area: '206', numbers: 1, contacts: 3, calls30: 0, connect: 0, vmRate: 0,
       minutesUsed: 0, minutesCap: 30, mrr: 0, ltv: 91, next: 'Canceled May 18',
       lines: [{ label: "Dadu's line", person: 'Karim Rahman · Grandfather', number: '(206) 555-0173', mode: 'cascade', minutesUsed: 0, contacts: 3 }] }),
];

/* newest signups feed for the overview */
const RECENT_SIGNUPS = ['ACC-2005', 'ACC-2027', 'ACC-2041', 'ACC-2038', 'ACC-2035']
  .map((id) => ACCOUNTS.find((a) => a.id === id))
  .filter(Boolean);

/* invoices / transactions for revenue view */
const TRANSACTIONS = [
  { id: 'in_8841', acct: 'Aisha Bello',    amt: 19.99, kind: 'paid',     when: 'Today · 11:04 AM',  plan: 'Pro · Monthly' },
  { id: 'in_8840', acct: 'Daniel Okonkwo', amt: 19.99, kind: 'paid',     when: 'Today · 9:30 AM',   plan: 'Pro · Monthly' },
  { id: 'in_8838', acct: 'James Patel',    amt: 19.99, kind: 'failed',   when: 'Today · 6:12 AM',   plan: 'Pro · Monthly' },
  { id: 'in_8835', acct: 'Tomás Rivera',   amt: 12.99, kind: 'paid',     when: 'Yesterday · 8:41 PM', plan: 'Essential · Monthly' },
  { id: 'in_8832', acct: 'Maria Delgado',  amt: 199.0, kind: 'paid',     when: 'Yesterday · 2:02 PM', plan: 'Pro · Annual' },
  { id: 'in_8829', acct: 'Kevin O\u2019Brien', amt: 12.99, kind: 'paid', when: 'Yesterday · 10:15 AM', plan: 'Essential · Monthly' },
  { id: 'in_8826', acct: 'Sofia Martinez', amt: 8.50,  kind: 'refund',   when: 'Mon · 4:48 PM',     plan: 'Goodwill credit' },
  { id: 'in_8824', acct: 'Aisha Bello',    amt: 19.99, kind: 'paid',     when: 'Mon · 11:30 AM',    plan: 'Pro · Monthly' },
];

const PAST_DUE = ACCOUNTS.filter((a) => a.status === 'past_due');

/* ---- Twilio (carrier) usage, billing & cost analytics ----
   Twilio is iCanCall's telephony provider, i.e. cost of goods.
   Spend ties to gross margin against the $9,847 MRR. */
const TWILIO = {
  spend: 2840,            // this month, to date (monthly run-rate cost)
  spendPrev: 2614,
  projected: 3010,        // projected month-end
  balance: 4210,          // prepaid account balance
  autoRecharge: 2000,     // tops up when balance crosses this
  costPerCall: 0.154,
  costPerMin: 0.026,
  costPerNumber: 3.99,
  spendSeries: [1180, 1290, 1380, 1510, 1660, 1820, 1990, 2160, 2320, 2510, 2680, 2840],
  breakdown: [
    { id: 'voice',      label: 'Programmable Voice', amt: 1180, color: 'var(--blue)' },
    { id: 'numbers',    label: 'Phone numbers',      amt: 819,  color: 'var(--teal-deep)' },
    { id: 'sms',        label: 'Messaging · alerts',  amt: 410,  color: 'var(--violet)' },
    { id: 'transcribe', label: 'Recording & transcription', amt: 250, color: 'var(--amber)' },
    { id: 'lookup',     label: 'Lookup & Verify',     amt: 181,  color: 'oklch(0.62 0.16 22)' },
  ],
  usage: {
    voiceMin: 46200, voiceIn: 41000, voiceOut: 5200,
    sms: 6240, smsAlerts: 5180, sms2fa: 1060,
    numbers: 712, numbersAdded: 52, numbersReleased: 9,
    transcriptions: 1068, recordings: 1342, lookups: 3140,
  },
  regions: [
    { code: '415', city: 'San Francisco', numbers: 168, spend: 712 },
    { code: '212', city: 'New York',       numbers: 142, spend: 604 },
    { code: '312', city: 'Chicago',        numbers: 96,  spend: 402 },
    { code: '305', city: 'Miami',          numbers: 88,  spend: 388 },
    { code: '206', city: 'Seattle',        numbers: 74,  spend: 318 },
    { code: '617', city: 'Boston',         numbers: 61,  spend: 266 },
  ],
  reliability: { callErrorRate: 0.8, smsUndelivered: 1.2, apiSuccess: 99.94, avgLatencyMs: 410 },
  charges: [
    { id: 'TW-44021', desc: 'Programmable Voice — daily usage', amt: 41.20, when: 'Today · 12:00 AM',  kind: 'usage' },
    { id: 'TW-44018', desc: 'Auto-recharge — balance top-up',   amt: 2000,  when: 'Yesterday · 3:14 PM', kind: 'recharge' },
    { id: 'TW-44012', desc: 'Phone number renewals (×214)',      amt: 246.10, when: 'May 28 · 2:00 AM',  kind: 'numbers' },
    { id: 'TW-44003', desc: 'Messaging — SMS alerts',            amt: 18.74, when: 'May 27 · 12:00 AM',  kind: 'usage' },
    { id: 'TW-43998', desc: 'Voice recording & transcription',   amt: 9.30,  when: 'May 26 · 12:00 AM',  kind: 'usage' },
  ],
};

Object.assign(window, {
  fmtUSD, fmtNum, MONTHS, KPI, MRR_SERIES, SIGNUP_SERIES, CHURN_SERIES, ACCOUNTS_SERIES,
  PLAN_SPLIT, PLAN_BILLING_BY_COUNT, PLAN_BILLING_BY_MRR, STATUS_SPLIT, MRR_MOVEMENT,
  FEATURES, HEALTH, ACCOUNTS, RECENT_SIGNUPS, TRANSACTIONS, PAST_DUE, TWILIO,
});
