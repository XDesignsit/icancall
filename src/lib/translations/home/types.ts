// Copy for the homepage (src/app/_home). Kept apart from HomepageTranslations,
// which the contact page, comparison chart, signup and waitlist still use.
//
// Placeholders in braces ({price}, {name}, …) are filled in at render time;
// keep them exactly as they are when translating. People's names, the phone
// number and the brand stay in English.
export interface HomeTranslations {
  meta: {
    title: string;
    description: string;
  };
  skip: string;
  nav: {
    home: string;
    primary: string;
    mobile: string;
    how: string;
    who: string;
    pricing: string;
    faq: string;
    language: string;
    login: string;
    getStarted: string;
    menu: string;
  };
  /** Relationship labels for the demo family (Maria, Joseph, Rosa, Dan). */
  rel: {
    daughter: string;
    son: string;
    grandma: string;
    neighbor: string;
  };
  hero: {
    eyebrow: string;
    /** Rendered as titleStart + <accent>titleAccent</accent>. */
    titleStart: string;
    titleAccent: string;
    lead: string;
    seeHow: string;
    /** {price} is the Essential monthly price. */
    fromPrice: string;
    guarantee: string;
    noContracts: string;
    stageLabel: string;
    noteLabel: string;
    worksOnAnyPhone: string;
    contacts: string;
    searchContacts: string;
    noAnswer: string;
    connected: string;
    pause: string;
    play: string;
    replay: string;
  };
  problem: {
    titleStart: string;
    titleAccent: string;
    lines: [string, string, string];
  };
  how: {
    eyebrow: string;
    title: string;
    railLabel: string;
    /** Five steps, in order. `aria` labels the rail button. */
    steps: { title: string; body: string; aria: string }[];
    greeting: string;
    voicemailFrom: string;
    transcript: string;
    sentByEmail: string;
    sentByText: string;
    caller: string;
    devices: { land: string; flip: string; smart: string };
    recording: string;
    status: {
      dialing: string;
      greeting: string;
      /** {name} is the person being rung. */
      ringing: string;
      noAnswer: string;
      talking: string;
      ringingCircle: string;
      voicemail: string;
      transcriptSent: string;
    };
    pill: { ringing: string; noAnswer: string; connected: string };
  };
  setup: {
    title: string;
    lead: string;
    spellsCare: string;
    localTo: string;
    first: string;
    second: string;
    /** {name} is the next person to add. */
    add: string;
    speedDial: string;
    cards: { title: string; body: string }[];
  };
  try: {
    eyebrow: string;
    title: string;
    noJsCircle: string;
    noJsHint: string;
  };
  sim: {
    legend: string;
    howItRings: string;
    modes: {
      cascade: { label: string; desc: string };
      everyone: { label: string; desc: string };
      menu: { label: string; desc: string };
    };
    planNote: string;
    yourCircle: string;
    /** {n} contacts of {max}. */
    count: string;
    hint: string;
    addContact: string;
    circleFull: string;
    whatIfNoAnswer: string;
    momCalling: string;
    callTime: string;
    hubLabel: string;
    momHears: string;
    recording: string;
    placeCall: string;
    pause: string;
    resume: string;
    reset: string;
    stop: string;
    endTitle: string;
    runAgain: string;
    available: string;
    busy: string;
    /** Name used when a contact's name is cleared. */
    contact: string;
    /** Relationship for an added contact once the pool of examples runs out. */
    family: string;
    /** Relationships for the extra contacts the Add button offers, in order. */
    poolRels: [string, string, string, string, string, string];
    pill: { ring: string; miss: string; busy: string; conn: string; stop: string; off: string };
    chip: { idle: string; dial: string; greet: string; menu: string; ring: string; conn: string; vm: string };
    say: {
      ready: string;
      calling: string;
      greeting: string;
      skipBusy: string;
      ringing: string;
      connected: string;
      noAnswer: string;
      busyOne: string;
      busyMany: string;
      ringingAll: string;
      answeredFirst: string;
      menuOption: string;
      hears: string;
      notInMenuOne: string;
      notInMenuMany: string;
      presses: string;
      voicemail: string;
      allBusy: string;
      transcribed: string;
    };
    /** Joins the last two names in a list ("Maria and Joseph"). */
    and: string;
    aria: {
      reorder: string;
      name: string;
      available: string;
      remove: string;
      isAvailable: string;
      isBusy: string;
      removed: string;
      moved: string;
      added: string;
      paused: string;
      resumed: string;
      stopped: string;
      resetDone: string;
    };
  };
  usecases: {
    eyebrow: string;
    title: string;
    moments: string;
    cards: { audience: string; title: string; body: string; chips: [string, string, string]; link: string; alt: string }[];
  };
  features: {
    eyebrow: string;
    title: string;
    phones: { title: string; body: string; landline: string; flip: string; smart: string };
    cascade: { title: string; body: string; available: string; busy: string };
    menu: { title: string; body: string; momHears: string; press: string };
    voicemail: { title: string; body: string; lines: [string, string, string, string] };
    voice: { title: string; body: string; natural: string; record: string; sample: string };
    dashboard: {
      title: string;
      body: string;
      callLog: string;
      callLogSub: string;
      answered: string;
      movedOn: string;
      voicemail: string;
      transcriptSent: string;
      yesterday: string;
      callsThisWeek: string;
      /** {n} of {total} contacts. */
      availableCount: string;
      availableNow: string;
    };
    private: { title: string; body: string; callerId: string; yourLine: string; hidden: string };
  };
  trust: {
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    lead: string;
    /** Card headings: guarantee, no contracts, privacy, two-step sign-in, support. */
    points: [string, string, string, string, string];
    /** Labels inside the cards' illustrations. */
    guarantee: { days: string; refund: string };
    terms: { setupFee: string; contract: string; none: string; cancel: string; anytime: string };
    privacy: { title: string; numbers: string; hidden: string; sold: string; never: string };
    signIn: { enterCode: string; verified: string };
    support: { question: string; answer: string; team: string };
    disclaimer: string;
  };
  pricing: {
    eyebrow: string;
    titleStart: string;
    titleAccent: string;
    lead: string;
    billingPeriod: string;
    monthly: string;
    annual: string;
    perMonth: string;
    perYear: string;
    mostPopular: string;
    choose: { essential: string; pro: string; careteam: string };
    guaranteeTitle: string;
    guaranteeBody: string;
    /** {numberPrice} per extra number a month, {minutesPrice} per 30 minutes. */
    more: string;
    organizations: string;
    compare: string;
    showingMonthly: string;
    showingAnnual: string;
  };
  faq: {
    title: string;
    /** {numberPrice} is the monthly price of an extra number. */
    items: { q: string; a: string }[];
  };
  final: {
    title: string;
    lead: string;
    talk: string;
    fine: [string, string, string];
    stageLabel: string;
    anyPhone: string;
    live: string;
  };
  footer: {
    blurb: string;
    product: string;
    compare: string;
    who: string;
    parents: string;
    seniors: string;
    caregivers: string;
    company: string;
    contact: string;
    legal: string;
    privacy: string;
    terms: string;
    copyright: string;
    moments: string;
    badgeAlt: string;
  };
}
