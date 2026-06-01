/* iCanCall onboarding — plans, number generation, helpers */

// Plans mirror the marketing pricing section.
const PLANS = [
  {
    id: 'essential',
    name: 'Essential',
    tag: null,
    desc: 'One number for one loved one.',
    numbers: 1,
    monthly: { amt: 12.99, label: '$12.99', per: '/mo', note: 'Billed monthly' },
    annual:  { amt: 129,   label: '$129',   per: '/yr', note: '$10.75/mo, billed yearly' },
    feats: ['1 phone number', '3 trusted contacts', 'Cascade + Caller Menu', '30 voice minutes'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tag: 'Most popular',
    desc: 'Full protection for the whole circle.',
    numbers: 2,
    monthly: { amt: 19.99, label: '$19.99', per: '/mo', note: 'Billed monthly' },
    annual:  { amt: 199,   label: '$199',   per: '/yr', note: '$16.58/mo, billed yearly' },
    feats: ['2 phone numbers', '6 trusted contacts', 'Cascade + Caller Menu', '60 minutes + alerts'],
  },
];

const planById = (id) => PLANS.find((p) => p.id === id) || PLANS[0];

// Common, friendly area codes to suggest.
const AREA_SUGGESTIONS = [
  { code: '415', city: 'San Francisco' },
  { code: '212', city: 'New York' },
  { code: '312', city: 'Chicago' },
  { code: '305', city: 'Miami' },
  { code: '206', city: 'Seattle' },
  { code: '617', city: 'Boston' },
];

// Letters → keypad digits, so a "memorable" word can be shown alongside.
const VANITY_WORDS = [
  { word: 'CARE', digits: '2273' },
  { word: 'HOME', digits: '4663' },
  { word: 'HELP', digits: '4357' },
  { word: 'SAFE', digits: '7233' },
  { word: 'CALL', digits: '2255' },
  { word: 'LOVE', digits: '5683' },
  { word: 'FAMILY'.slice(0, 4), digits: '3264' }, // FAMI
];

function pad(n, len) { return String(n).padStart(len, '0'); }

// Detect "memorable" patterns in the last 7 digits for a little badge.
function memorableLabel(prefix, line) {
  // line is 4-digit string, prefix is 3-digit string
  if (line[0] === line[1] && line[1] === line[2] && line[2] === line[3]) return 'Repeating';
  if (line === '1234' || line === '4321' || line === '2345') return 'Sequence';
  if (line[0] === line[3] && line[1] === line[2]) return 'Mirror';
  if (prefix === line.slice(0, 3)) return 'Easy recall';
  return null;
}

let _numSeed = Math.floor(Math.random() * 9000);

/* Mock of the Twilio "available phone numbers" lookup.
   In production this calls the backend, which queries Twilio for the area code.
   Returns up to `count` formatted, selectable numbers. Each refresh yields a fresh set. */
function fetchNumbers(areaCode, count = 6) {
  const ac = (areaCode || '').replace(/\D/g, '').slice(0, 3) || '415';
  const out = [];
  const usedVanity = new Set();
  for (let i = 0; i < count; i++) {
    _numSeed = (_numSeed * 1103515245 + 12345) & 0x7fffffff;
    const r = _numSeed;
    let prefix, line, vanity = null;

    // ~1 in 3 gets a vanity word on the last 4 digits
    if (r % 3 === 0) {
      const v = VANITY_WORDS[(r >> 4) % VANITY_WORDS.length];
      if (!usedVanity.has(v.word)) {
        usedVanity.add(v.word);
        prefix = pad(200 + ((r >> 8) % 700), 3);
        line = v.digits;
        vanity = v.word;
      }
    }
    if (!line) {
      prefix = pad(200 + ((r >> 6) % 700), 3);
      line = pad((r >> 10) % 10000, 4);
    }

    const formatted = `(${ac}) ${prefix}-${line}`;
    const memo = vanity ? `Spells ${vanity}` : memorableLabel(prefix, line);
    out.push({
      id: `${ac}-${prefix}-${line}-${i}`,
      number: formatted,
      area: ac,
      memorable: memo,
    });
  }
  return out;
}

const initials = (name) =>
  (name || '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

function passwordStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4); // 0..4
}

const STRENGTH = [
  { label: '', color: 'transparent', w: '0%' },
  { label: 'Weak', color: 'var(--rose)', w: '25%' },
  { label: 'Fair', color: 'oklch(0.72 0.14 75)', w: '55%' },
  { label: 'Good', color: 'oklch(0.70 0.13 140)', w: '80%' },
  { label: 'Strong', color: 'var(--green)', w: '100%' },
];

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim());

const STEPS = [
  { key: 'plan',    label: 'Plan' },
  { key: 'account', label: 'Account' },
  { key: 'number',  label: 'Number' },
  { key: 'payment', label: 'Payment' },
];

Object.assign(window, {
  PLANS, planById, AREA_SUGGESTIONS, fetchNumbers, initials,
  passwordStrength, STRENGTH, validEmail, STEPS,
});
