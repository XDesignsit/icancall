/* iCanCall Dashboard — demo data + helpers */

const AVATAR_COLORS = [
  'oklch(0.58 0.115 232)', 'oklch(0.62 0.10 198)', 'oklch(0.55 0.13 285)',
  'oklch(0.60 0.13 30)', 'oklch(0.58 0.13 145)', 'oklch(0.6 0.14 350)',
];

const initials = (name) =>
  (name || '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

// Two numbers managed by caregiver Maria Delgado (Pro plan)
const INITIAL_LINES = [
  {
    id: 'mom',
    label: "Eleanor's line",
    person: 'Eleanor Delgado · Mom',
    number: '(415) 555-0142',
    color: 'oklch(0.6 0.14 350)',
    mode: 'menu', // caller picks from a menu
    minutesUsed: 38,
    contacts: [
      { id: 'c1', name: 'Maria Delgado', rel: 'Daughter', phone: '(415) 555-0192', color: AVATAR_COLORS[0], available: true },
      { id: 'c2', name: 'James Delgado', rel: 'Son', phone: '(510) 555-0177', color: AVATAR_COLORS[1], available: true },
      { id: 'c3', name: 'Dr. Anita Patel', rel: 'Primary physician', phone: '(415) 555-0240', color: AVATAR_COLORS[2], available: false },
      { id: 'c4', name: 'Sunrise Home Care', rel: 'Daytime caregiver', phone: '(415) 555-0311', color: AVATAR_COLORS[3], available: true },
      { id: 'c5', name: 'Lena Novak', rel: 'Neighbor', phone: '(415) 555-0156', color: AVATAR_COLORS[4], available: true },
    ],
  },
  {
    id: 'dad',
    label: "Robert's line",
    person: 'Robert Hale · Dad',
    number: '(415) 555-0188',
    color: 'oklch(0.58 0.115 232)',
    mode: 'cascade', // ring contacts in order
    minutesUsed: 11,
    contacts: [
      { id: 'd1', name: 'Maria Delgado', rel: 'Daughter', phone: '(415) 555-0192', color: AVATAR_COLORS[0], available: true },
      { id: 'd2', name: 'Carla Hale', rel: 'Sister', phone: '(206) 555-0133', color: AVATAR_COLORS[5], available: true },
      { id: 'd3', name: 'Dr. Sam Okafor', rel: 'Cardiologist', phone: '(415) 555-0299', color: AVATAR_COLORS[2], available: true },
    ],
  },
];

// Call log keyed by line id
const INITIAL_LOG = {
  mom: [
    { id: 1, status: 'connected', caller: 'Eleanor (mobile)', routed: 'Maria Delgado', rel: 'Daughter', dur: '4:12', when: 'Today · 2:48 PM' },
    { id: 2, status: 'connected', caller: 'Eleanor (mobile)', routed: 'Sunrise Home Care', rel: 'Daytime caregiver', dur: '1:05', when: 'Today · 9:30 AM' },
    { id: 3, status: 'voicemail', caller: 'Unknown', routed: 'No one available', rel: 'Voicemail left', dur: '0:38', when: 'Yesterday · 7:14 PM' },
    { id: 4, status: 'connected', caller: 'Eleanor (mobile)', routed: 'James Delgado', rel: 'Son', dur: '6:51', when: 'Yesterday · 11:02 AM' },
    { id: 5, status: 'missed', caller: 'Eleanor (mobile)', routed: 'Dr. Anita Patel', rel: 'Primary physician', dur: '—', when: 'Mon · 3:20 PM' },
    { id: 6, status: 'connected', caller: 'Eleanor (mobile)', routed: 'Maria Delgado', rel: 'Daughter', dur: '2:44', when: 'Mon · 8:55 AM' },
    { id: 7, status: 'connected', caller: 'Lena Novak', routed: 'Maria Delgado', rel: 'Daughter', dur: '3:30', when: 'Sun · 5:41 PM' },
  ],
  dad: [
    { id: 1, status: 'connected', caller: 'Robert (mobile)', routed: 'Maria Delgado', rel: 'Daughter', dur: '5:20', when: 'Today · 1:12 PM' },
    { id: 2, status: 'connected', caller: 'Robert (mobile)', routed: 'Dr. Sam Okafor', rel: 'Cardiologist', dur: '2:08', when: 'Yesterday · 10:30 AM' },
    { id: 3, status: 'missed', caller: 'Robert (mobile)', routed: 'Carla Hale', rel: 'Sister', dur: '—', when: 'Wed · 6:02 PM' },
    { id: 4, status: 'connected', caller: 'Robert (mobile)', routed: 'Maria Delgado', rel: 'Daughter', dur: '1:47', when: 'Tue · 9:18 AM' },
  ],
};

const PLAN_MINUTES = 60; // per line, Pro

const STATUS_META = {
  connected: { badge: 'badge-green', label: 'Connected', dirCls: 'dir-in' },
  missed: { badge: 'badge-rose', label: 'Missed → alerted', dirCls: 'dir-miss' },
  voicemail: { badge: 'badge-blue', label: 'Voicemail', dirCls: 'dir-vm' },
};

Object.assign(window, {
  AVATAR_COLORS, initials, INITIAL_LINES, INITIAL_LOG, PLAN_MINUTES, STATUS_META,
});
