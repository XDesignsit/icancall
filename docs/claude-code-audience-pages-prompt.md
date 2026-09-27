# Claude Code prompt: redesign the iCanCall audience pages (/seniors, /parents, /caregivers)

> Open Claude Code at the repository root and paste everything between the two lines. The appendix at the bottom is **not** for pasting yet.

---

Redesign iCanCall's three audience landing pages: **For Seniors** (`/seniors`), **For Parents** (`/parents`) and **For Caregivers** (`/caregivers`).

They are siblings of the icancall.co homepage. They need premium, scroll-animated craft: strong visual storytelling, a pinned "story of one call", and a hands-on call simulator. Each page tells its own story, to its own reader, with its own cast of characters.

**Work in this order:**
1. Read the sources in §0.
2. Post a short plan: the files you'll create or change, and the shared CSS/JS you'll write once.
3. Build **Seniors first**, then Parents, then Caregivers.
4. Verify and commit each page before starting the next.

# 0. Read before writing any code

**Project rules**
- `AGENTS.md`: the rules for syncing standalone pages, the no-emoji rule, and the Next.js docs note.
- `.design-sync/conventions.md`: brand voice and class-name rules. Never rename a class.

**Brand tokens and landing classes**
- `src/app/globals.css`. It holds the colour tokens (`--bg`, `--ink`, `--blue`, …), radii, shadows, type scale and the landing-page classes (`.wrap`, `.section`, `.tint-band`, `.eyebrow`, `.lead`, `.card`, `.hero`, `.trust`, `.cta-band`, `.footer`).

**The current pages**
- `public/seniors.html`, `public/parents.html` and `public/caregivers.html` are Claude Design bundler exports. The real page is JSON-encoded inside `<script type="__bundler/template">`; decode it the way `scratch/unpack-template.js` does. Older unpacked copies are in `scratch/unpacked_{seniors,parents,caregivers}/`, but treat the files in `public/` as the source of truth.
- Each template holds the current copy, the `DICT_MAP` translations and the language-selector logic.
- They are served by `src/app/{seniors,parents,caregivers}/route.ts`, which read the file from `public/` and return it. Keep that mechanism.

**Homepage patterns**
- `src/app/page.tsx` and `src/lib/translations/en.ts`: the hero demo, simulator, pricing and FAQ. If the new homepage has already been rebuilt, match its components and motion.

**Facts**
- `src/lib/pricing.ts` is the source of truth for prices.
- `src/app/api/twilio/voice/route.ts` is the source of truth for what a call actually does. Check every product claim against the code, and if a claim isn't supported, leave it out.

**Assets**
- `public/usecases/aging-parent.png`, `child-calling.png` and `special-abilities.png`. The logo is `public/icon.svg`.

# 1. Technical approach

**One file per page**
- Replace each bundled page with a **hand-written, self-contained HTML file** at the same path in `public/`.
- Each file contains semantic HTML with the real copy in the markup, one inline `<style>`, and one inline `<script>` in vanilla JS.
- Do not use:
  - the bundler format;
  - a framework or a build step;
  - external JS libraries or CDNs;
  - web fonts. Use the design-system font stack.

**Why:** today's bundles render everything from a compressed template, so search engines and no-JS visitors see an empty page. Plain HTML fixes that, and it stays easy to edit.

**CSS**
- Copy the tokens and the landing classes you need from `globals.css`, keeping the class names identical.
- Write the shared CSS and JS once (header, simulator, pricing, FAQ, motion helpers). Paste the identical block into each file between `/* shared:start */` and `/* shared:end */` comments, so the three copies are easy to keep in sync. The pages must stay standalone.

**Translations (11 languages)**

Keep the existing mechanism:
- A `DICT_MAP` keyed by the **exact English strings**.
- The language choice lives in `localStorage.lang`, which the homepage shares.
- Arabic sets `dir="rtl"`.
- Switching between two non-English languages reloads the page first.
- The language selector shows language names with no flag emoji: English, Español, Français, 日本語, 中文, العربية, हिन्दी, Português, Deutsch, Italiano, 한국어.

How to write them:
- Keep every sentence whole inside a single element.
- If you animate word by word, split the words at runtime, after translation has run.
- Write draft translations for es, fr, ja, zh, ar, hi, pt, de, it and ko for every visible string. Reuse the current translations wherever the English string hasn't changed.
- Add a comment marking the translations as drafts that need native review.

**Head tags**
- Keep a strong `<title>` and meta description on each page.
- Add `og:title`, `og:description` and `og:image` (the page's audience photo).

**Keep every anchor ID** listed in the skeleton (§4), because existing links point to them.

# 2. Product facts (build only on these)

**The number**
- Each loved one gets **one memorable phone number**. It's usually local, and sometimes spells a word like CARE or HOME.
- It can be dialled from any phone: a landline, a flip phone, a smartphone, a tablet that can make calls, an adaptive big-button caller or a speed-dial button.
- The caller needs no app, no account and no new device.

**What the caller hears**
- A short greeting plays first. It can be a natural-sounding voice (there are 8 to choose from), or **a message the family records themselves**.
- By default, the caller then **presses 1 to reach the family**, or 2 to leave a message. If they press nothing for 8 seconds, the call goes to voicemail.
- **Direct connect** skips that key press, so the call starts ringing the circle right after the greeting.
  - It's a per-line setting: dashboard → Routing → "Connect callers straight away".
  - It's available on every plan, and it's **off by default**.
  - It works with Call Cascade and All ring. It doesn't apply to Caller menu.
  - The trade-off: spam and robocalls ring through too.
- In Caller menu mode, the caller hears "Press 1 for Maria, press 2 for Joseph…" instead, with each name in the family's own recorded voice.

**How it rings (routing)**
- **Call Cascade:** one person at a time, in the order you choose. Each person rings for about 15 seconds before the call moves on.
- **All ring:** every available contact at once.
- **Caller menu:** the caller picks who to reach.
- The Essential plan uses Call Cascade only. Pro and Care Team unlock all three modes.

**During the call**
- Each contact can be marked **Busy** or **Available**. Busy contacts are skipped.
- Whoever answers can **press \* to hand the call to another person in the circle**, without the caller hanging up.

**If no one answers**
- The caller leaves a voicemail of up to 2 minutes.
- It's transcribed and sent to **the account owner** by email and text.

**The dashboard**
- Add and reorder contacts, and mark people Busy or Available.
- Choose the routing mode, direct connect and the greeting.
- See a call log that shows every call, including missed attempts.
- Sign-in is protected by a two-step SMS code.
- The Care Team plan adds a **second caregiver login**.

**Trust**
- Personal numbers stay hidden behind the one iCanCall line, and we never sell your data.
- Setup takes under five minutes.
- 30-day money-back guarantee, no contracts, no setup fees.
- iCanCall is **not** an emergency or medical-alert service. Always call 911 in an emergency.

# 3. Look and feel

**Overall:** premium, calm, warm and trustworthy. Think the scroll pacing of an Apple product page, the craft of Stripe's illustrations, and the warmth of a family photo on the fridge.

**Colour.** Use the `globals.css` tokens:

| Token | Hex | Use |
|---|---|---|
| `--bg` | #f9fdff | Page background |
| `--surface` | #ffffff | Cards and surfaces |
| `--tint` | #e7f7fc | Soft blue wash |
| `--tint-2` | #d8f2f7 | Deeper wash |
| `--line` | #d6e0e4 | Hairline borders |
| `--ink` | #192531 | Main text |
| `--ink-soft` | #4b5761 | Secondary text |
| `--blue` | #0f85b2 | Primary buttons |
| `--blue-deep` | #005886 | Accents |
| `--blue-ink` | #003b60 | Immersive dark chapters |
| `--teal` | #50b7b8 | Accent |
| `--teal-deep` | #1c989c | Accent |
| `--green` | #4ab67f | Connected only |
| `--rose` | #dd4c5c | Missed only, used sparingly |

- **Signature gradient:** `linear-gradient(150deg, var(--blue-deep), var(--blue) 55%, var(--teal-deep))`.
- **Rhythm:** mostly light, airy sections, with two immersive deep-navy chapters: the call story and the final CTA.
- **Page accents:** each page gets one accent colour, used for illustration fills and highlights. It is never used for body text. Seniors uses `--blue-deep`, Parents uses `--teal` and Caregivers uses `--teal-deep`. Links and buttons stay on the brand blue everywhere.
- **Type:** use the `--font` stack, with weight 700 headlines, −0.025em tracking and sentence case. Every phone number, timer and price uses `--mono` with tabular numerals.

**Craft**
- 120 to 160px of section spacing on desktop, and a 1180px max width (`--maxw`).
- 24 to 32px radii, soft layered shadows (`--shadow-md`, `--shadow-lg`) and 1px hairlines.
- The header turns frosted glass on scroll.

**Never use:**
- emoji anywhere. Use a small inline SVG icon set with a 1.5px stroke and round caps;
- generic blob gradients or stock illustrations;
- auto-advancing carousels, countdowns or fake scarcity;
- scroll-jacking.

# 4. Shared page skeleton and modules

**Section order.** Every page follows this order. The page-specific content is in §7.

| # | Section | Journey stage | Anchor |
|---|---|---|---|
| 0 | Sticky header | — | — |
| 1 | Hero | attention | — |
| 2 | Trust strip | reassurance at a glance | — |
| 3 | Chapter one: the audience's problem | recognition | page-specific |
| 4 | The story of one call, pinned and immersive | understanding | `#how` |
| 5 | Setup in three steps | understanding | `#setup` |
| 6 | Moments chapter | fit | page-specific |
| 7 | Try it: the simulator | belief | `#build` |
| 8 | Features bento | belief, in detail | `#features` |
| 9 | Peace-of-mind band plus pricing | confidence and decision | `#pricing` |
| 10 | FAQ | reassurance | `#faq` |
| 11 | "Also made for" cross-links | — | `#usecases` |
| 12 | Final CTA | action | `#cta` |
| 13 | Footer | — | — |

**Header**
- Logo mark plus the "iCanCall" wordmark, linking to `/`.
- Four page-specific nav links.
- The language selector.
- A ghost button, "See how it works" (→ `#how`), and the page's primary CTA button (→ `#pricing`).
- On mobile, a sticky bottom CTA bar appears once the hero leaves the viewport.

**Hero call animation.** It plays once on load, over about 2.5 seconds:
1. The number card types in.
2. A signal pulse radiates from the card.
3. The first contact rings, then dims with the label "No answer".
4. The second contact turns green with "Connected · 0:04".
5. The scene breathes gently for a few cycles, then rests.

The H1 is in the HTML and visible at first paint. Never fade in the largest element on screen.

**Pinned call story (`#how`)**
- A deep-navy section, 300 to 400vh tall, with a sticky stage.
- Left: the step copy, which changes with scroll.
- Right: the page's signature SVG illustration, with a glowing "call thread" travelling from the caller to the circle.
- A progress rail marked 1 to 5, and a mono call timer that fast-forwards.
- Contact states: ringing (a teal pulse), no answer (dim grey), Busy (skipped, shown with a "Busy" label and a jump-over arc), connected (a steady green glow) and voicemail (a waveform that turns into a transcript card that types itself out).
- When a page's story uses direct connect, show a small "Direct connect: on" chip on the stage.

**Setup (`#setup`)**
- Three step cards, with a connecting line that draws itself as they enter.
- The cards rise one after another with an 80ms stagger.

**Simulator (`#build`)**
- **Routing mode:** a segmented control for Call Cascade, All ring and Caller menu, with a note: "All ring and Caller menu are on Pro and Care Team."
- **Direct connect switch:** "Press 1 first" or "Connect straight away". Each page sets its own default (§7). In Caller menu mode, disable it with the note "The caller menu always asks the caller to choose."
- **The circle:** three pre-filled contacts from the page's cast. Names can be edited inline. Visitors can add contacts up to six and reorder them. Dragging must have a keyboard alternative, such as up and down buttons. Each contact has an Available / Busy toggle.
- **"Place a test call":** runs the call and announces each state through `aria-live`:
  - With direct connect off: "Greeting… Pressed 1. Ringing Sarah… No answer. Ringing David… Connected."
  - With direct connect on: "Greeting… Connecting. Ringing Sarah…"
- **"What if no one answers?":** a switch that plays the voicemail path and ends on a transcript card, labelled "Sent to you by email and text".
- **End state:** a CTA card with the page's primary CTA.
- Fully keyboard-operable. On mobile, the contacts stack vertically.

**Features bento (`#features`)**
- Six or seven tiles.
- Each tile has a small product render in HTML/CSS that mimics the dashboard (a contact row with a Busy/Available toggle, a call-log row, a transcript card) using the page's own cast.
- Each tile has one micro-animation that plays once when it enters the viewport.

**Peace-of-mind band.** It sits directly above pricing:
- Five trust points, each with an SVG icon:
  1. 30-day money-back guarantee
  2. No contracts, no setup fees
  3. Personal numbers stay private, and we never sell your data
  4. Two-step sign-in
  5. Real people answer support within one business day
- A testimonial slot with three cards containing **visible placeholder text only**: "[Real customer quote]" · "[Name, relationship]". Never invent quotes or names.
- A disclaimer: "iCanCall helps your family reach each other fast. It isn't a medical alert or emergency service. In an emergency, always call 911."

**Pricing (`#pricing`)**
- Take the numbers from `src/lib/pricing.ts`.
- A Monthly / Annual toggle with a "Save 17%" badge. Prices tween when the toggle changes.
- Sub-line: "Every plan works on any phone and includes voicemail transcripts by email and text. No setup fees, cancel anytime."
- The plans:

| Plan | Monthly | Annual | Includes |
|---|---|---|---|
| **Essential** | $14.99/mo | $149/yr ("Just $12.42/mo, billed annually") | 1 dedicated number · up to 3 trusted contacts · Call Cascade · 30 voice minutes a month |
| **Pro** (badge: "Most popular") | $24.99/mo | $249/yr ("Just $20.75/mo…") | 2 dedicated numbers · up to 6 contacts per number · Cascade, All ring and Caller menu · 60 voice minutes a month |
| **Care Team** | $49.99/mo | $499/yr ("Just $41.58/mo…") | 5 dedicated numbers · up to 15 contacts per number · all routing modes · 150 pooled voice minutes a month · 2 caregiver logins |

- Plan CTAs: "Choose Essential", "Choose Pro" and "Choose Care Team". Each links to `/signup?plan=essential|pro|careteam&billing=monthly|annual`, with the billing value following the toggle.
- Below the plans:
  - "Need more? Extra numbers $3.99/mo each · Extra minutes $4.99 per 30."
  - "See how we compare" → `/comparison-chart`.

**FAQ (`#faq`)**
- An accordion built on `<details>`/`<summary>` or accessible buttons.
- One item open at a time, with a smooth height transition.

**Also made for (`#usecases`)**
- Two compact photo cards linking to the other two audience pages, plus a text link: "For every family → /".

**Final CTA (`#cta`)**
- A deep-navy section with the signature gradient glow.
- A bookend to the hero: the number card returns, the circle closes around it, a green "Live" dot appears and every contact is connected.
- The page's primary CTA, plus a secondary "Talk to a real person" → `/contact`.
- Fine print: "Set up in minutes · No setup fees · Cancel anytime".

**Footer**
- Logo and the page's blurb.
- **Product:** How it works, Pricing, FAQ, Compare.
- **Who it's for:** Parents, Seniors, Caregivers.
- **Company:** For every family (`/`), Contact.
- **Legal:** Privacy (`/privacy-policy`), Terms (`/terms-of-service`).
- Bottom row: "© 2026 iCanCall, Inc." · "Made for the moments that matter." · the ElevenLabs Grants badge, copied from the homepage footer in `src/app/page.tsx`.
- Do not include About, Careers or Security links. Those pages don't exist.

# 5. Motion system

**Easing and timing**
- Entrances use `cubic-bezier(0.22, 1, 0.36, 1)`.
- Scrubbed transitions use `cubic-bezier(0.65, 0, 0.35, 1)`.
- Durations are 400 to 900ms, with a 60 to 80ms stagger.

**Properties:** animate only `transform`, `opacity`, `clip-path` and `filter`.

**Techniques**
- CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`) inside `@supports`, with an IntersectionObserver fallback.
- Pinned sections use `position: sticky`, with progress calculated in a passive scroll listener plus `requestAnimationFrame`.
- Never change the native scroll speed.

**Restraint**
- Every animation shows something true about the product.
- At most one subtle parallax layer per section.
- Nothing loops indefinitely.
- No flashing, ever.

**Reduced motion**
- `prefers-reduced-motion: reduce` gets simple fades or static end states.
- Pinned sections become stacked static steps, each with its own illustration.

**Horizontal pinned galleries** are for desktop only. At 768px and below they become vertical stacks with reveals.

# 6. Voice and claim guardrails

**Voice**
- Calm, plain and warm.
- Speak to "you", the person setting it up.
- Use specific people and specific moments.
- Keep sentences short, and use sentence case.
- Never clinical, never cute, never fear-selling.
- Show the caller as capable and independent, never as helpless.

**Never claim or imply:**
- that every contact, or the whole team, gets a text when someone calls. Only the account owner gets voicemail alerts;
- that calls are routed by time of day, "24/7 coverage" or "around-the-clock" routing;
- that callers "just dial" or have "nothing to press" **unless the same section ties it to direct connect** ("with direct connect on…"). Direct connect is off by default, so without it the caller presses 1;
- that "a familiar voice answers right away" or that family is reached "in seconds";
- uptime figures, encryption claims ("encrypted", "end-to-end", "bank-level"), HIPAA or SOC 2;
- a free trial;
- AI call screening;
- a medical-alert or emergency service;
- superlatives such as "the only…";
- any named testimonial.

# 7. The three pages

Section numbers match the skeleton in §4. Any section not listed for a page (such as 11, the cross-links) uses the shared module as is.

## 7A. For Seniors (`public/seniors.html`), build this first

**Setup**
- **Reader:** an adult child, aged 40 to 65, whose parent is 70 or older and often lives apart from them. They are worried, but they respect their parent's independence.
- **Emotional core:** dignity. The parent keeps their routine, and the family gets peace of mind.
- **Cast:**
  - Mom is the caller.
  - The circle is Sarah R. · Daughter (the account owner), David M. · Son, Lena N. · Neighbor and June · Mom's sister.
- **Number card:** (415) 200-CARE, labelled "Mom's iCanCall number".
- **Signature visual:** the kitchen landline and a note on the fridge. The phone's **coiled cord** uncoils into the glowing call thread that travels to the family.
- **Primary CTA:** "Set it up for them".
- **Nav:** Nothing to learn (`#noapp`) · How it works (`#how`) · Try it (`#build`) · Pricing (`#pricing`) · Questions (`#faq`).
- **Direct connect:** on in the story, and on by default in the simulator.
- **Readability:** readers here skew older. Use 19px body text, 52px-tall buttons, and aim for AAA contrast on body copy.

**1. Hero**
- **Eyebrow:** For families with aging parents
- **H1:** Mom can always reach you. On the phone she already uses.
- **Lead:** Give your parent one easy number that quietly finds the whole family, one person after another, until someone picks up. No app to install and no new device to charge. You set it up in minutes from your own phone.
- **Note under the CTAs:** Works on a landline, a flip phone or a smartphone. Turn on direct connect and there's nothing for her to press.
- **Visual:** a landline handset on a side table, beside a fridge-note card reading "(415) 200-CARE · Family".
- **Hero animation:** Sarah shows "No answer", then David shows "Connected".

**2. Trust strip**

0 apps to install · 0 new devices to charge · 1 number on the fridge · Any phone she already has

**3. Chapter one (`#noapp`)**
- **Eyebrow:** No app · No new device
- **H2:** Nothing new for her to learn.
- **Body:** The hardest part of most safety gadgets is getting a parent to use them. iCanCall lives on the phone that's already by her chair. The only new thing is one number, and with direct connect on, there's nothing to press: she dials, and the family's phones start ringing.
- **Bullets:**
  - No app to download and no account for her to manage.
  - No new gadget to charge, wear or learn to operate.
  - One number to remember, written once on the fridge.
- **Scroll animation, scrubbed:**
  1. A landline, a flip phone and a smartphone glide in at different depths.
  2. Each one dials the same number and gets a "Works" check.
  3. Their three dial lines converge into the single number card.

**4. The call story (`#how`): "One ordinary Tuesday."**
1. **Mom picks up the phone by her chair.** She dials the number on the fridge, or presses the speed dial marked "Family".
2. **A voice she knows answers.** Sarah recorded the greeting: "Hi Mom, it's Sarah. Hang on, I'm finding one of us." Direct connect is on, so there's nothing to press.
3. **It rings Sarah.** She's in a meeting, so after a few rings the call moves on by itself.
4. **David picks up.** "Hi Mom." That's all it takes.
5. **If no one can answer, nothing is lost.** Mom leaves a message, and Sarah gets it as text, by email and SMS, so she can call straight back.

**5. Setup (`#setup`)**
- **H2:** You set it up. She just dials.
- **Lead:** Three quiet steps, all on your side.

1. **Claim her number.** Pick a local number, sometimes one that spells a word like CARE or HOME. Put it on the fridge, set it as a speed dial, or save it as "Family".
2. **Add the family circle.** You, your siblings and a trusted neighbour, in the order you want them reached. You manage it all from your phone, and nothing is installed on hers.
3. **Choose how it answers.** Record a greeting in your own voice, and turn on direct connect so all she does is dial.

**6. Moments (`#moments`)**
- **H2:** For the big calls and the everyday ones.
- **Lead:** When one number reaches the whole family, calling never feels like a bother.
- **Four cards, each with a small illustration:**
  - A ride to Thursday's appointment
  - A letter that doesn't look right
  - Good news she can't wait to share
  - Something that just doesn't feel right
- **Animation:** a pinned horizontal gallery on desktop.

**7. Simulator (`#build`)**
- **H2:** Build the circle that answers for Mom.
- **Pre-filled contacts:** Sarah (Daughter), David (Son), Lena (Neighbor).
- **Note:** You manage all of this. She only ever dials one number.

**8. Features (`#features`)**
- **H2:** Made for the call that can't go unanswered.
- **Tiles:**
  - **Works on any phone:** landline, flip phone or smartphone.
  - **The whole family, in order:** up to 6 people per number on Pro.
  - **Nothing to press:** turn on direct connect, and the call rings the family right after the greeting.
  - **Your voice first:** record the greeting, and each name for the caller menu.
  - **Never a dead end:** voicemails are transcribed and sent to you by email and text.
  - **See every call:** the call log includes missed attempts. Mark someone Busy for the week they're travelling.
  - **Private by design:** everyone's personal number stays hidden.

**9. Pricing**
- **H2:** Peace of mind, for less than a phone bill.
- **Plan taglines:**
  - Essential: "One number for one parent."
  - Pro: "Full protection for the whole circle."
  - Care Team: "Caring for both parents, or sharing the load with a sibling?"

**10. FAQ (`#faq`)**
- **H2:** What families ask us most.

1. **Does my parent need a smartphone?** Not at all. It works on a landline, a basic flip phone or a smartphone. There's no app and no new device.
2. **Will it work with her landline?** Yes. Many families set it as a one-touch speed dial, or write it on a card by the phone.
3. **Does she have to learn anything new?** Just the number. Turn on direct connect in your dashboard and the call rings the family right after the greeting, with nothing to press. If you'd rather screen out robocalls, leave it off, and she presses 1 when the greeting asks.
4. **What happens if nobody answers?** Each person rings in turn. If no one picks up, she can leave a message. It's transcribed and sent to you by email and text.
5. **Can I set it up and manage it for her?** Yes, and most families do. Changes take effect on the very next call.
6. **Can my brother and I share it?** Everyone in the circle receives her calls. To share the dashboard as well, the Care Team plan includes a second caregiver login.
7. **Is her information private?** Yes. Everyone's personal numbers stay hidden behind the iCanCall line, and we never sell your data.
8. **Is this a medical alert?** No. iCanCall helps her reach family quickly. It complements, but doesn't replace, 911 or a medical-alert service.

**12. Final CTA**
- **H2:** Set it up today. Rest easier tonight.
- **Lead:** In a few minutes, your parent will have one number that finds the family, on the phone she already knows how to use.

**Footer blurb:** One memorable number that connects your parent to the people who matter most, on the phone they already use.

**Imagery**
- Use `aging-parent.png` in the hero or chapter one.
- Draw the rest as inline SVG: the landline, the coiled cord, the fridge note and the moment illustrations.
- Keep it dignified. Never show the parent as frail, confused or alone in the dark.

## 7B. For Parents (`public/parents.html`)

**Setup**
- **Reader:** parents of children aged 4 to 10 who don't want to hand a young child a smartphone.
- **Emotional core:** the child's first independence, and the parent's reassurance. The number is a family password, learned like a nursery rhyme.
- **Cast:**
  - Emma, aged 7, is the caller.
  - The circle is Mom · Mobile (the account owner), Dad · Mobile, Grandma Rose · Grandparent and Mr. Alvarez · Neighbor.
- **Number card:** (415) 200-CARE, labelled "Emma's family number".
- **Signature visual:** a **backpack tag** with the number on it. It sways gently with scroll and travels with Emma through the page. Small hand-drawn touches, such as a crayon underline or a sticker edge, are allowed in the illustrations only, and kept restrained.
- **Primary CTA:** "Get started".
- **Nav:** One number (`#lesson`) · How it works (`#how`) · Try it (`#build`) · Pricing (`#pricing`) · Questions (`#faq`).
- **Direct connect:** off in the story, where the one press is part of the lesson, and off by default in the simulator.

**1. Hero**
- **Eyebrow:** For parents of young children
- **H1:** One number they'll never forget.
- **Lead:** Little ones can't memorise a contact list, but they can learn one number. iCanCall turns it into the whole family: it rings you, then your partner, then Grandma, then a trusted neighbour, until someone who loves them picks up.
- **Note under the CTAs:** No phone of their own needed. They can call from a friend's house, the school office or any phone.
- **Visual:** the backpack-tag card, surrounded by the circle of four.

**2. Trust strip**

1 number to learn · 0 apps to install · No phone of their own needed · Works from any phone

**3. Chapter one (`#lesson`)**
- **Eyebrow:** The whole lesson
- **H2:** One number is all they have to learn.
- **Body:** Ask a five-year-old to remember Mom's cell, Dad's cell, Grandma's house and the neighbour next door, and you'll lose them at "cell." iCanCall replaces the whole list with one number.
- **Scroll animation, scrubbed:**
  1. "The old way": a fridge note with four scribbled numbers and the question "Which one do I call if you don't answer?"
  2. As the visitor scrolls, the numbers peel off and flutter away.
  3. The note reshapes into the single backpack tag: "(415) 200-CARE · If you ever need us, call this. It will find one of us."

**4. The call story (`#how`): "3:40 pm. Emma's home first."**
1. **Emma dials the number she learned as a song.** She uses the kitchen phone, the one on the wall.
2. **Your voice answers.** Mom recorded the greeting: "Hi sweetheart! Press 1 and we'll find a grown-up." Emma presses 1.
3. **It rings Mom.** She's in a meeting, so the call moves on by itself.
4. **Dad's marked Busy today, so it skips him. Grandma Rose picks up.** "I'm on my way, love."
5. **Later, you see the whole story.** Your call log shows who she called, who answered and when. If no one had picked up, her message would have reached you by email and text.

**5. Setup (`#setup`)**
- **H2:** Set it up once. Teach it once.

1. **Claim your family number.** Put it on a backpack tag, a lunchbox card and the school contact form.
2. **Add the grown-ups.** You, your partner, grandparents, a sitter or a trusted neighbour, in the order you want. You can change it anytime from your phone.
3. **Teach it together.** Turn the number into a little song, then practise a pretend call, greeting and one press included.

**6. Moments (`#scenes`)**
- **H2:** The same number works everywhere life happens.
- **Lead:** No phone of their own? No problem.
- **Four scenes:**
  - **Home after school:** Beat you home? One call reaches whoever's free.
  - **At a friend's house:** From a friend's landline or a parent's phone, the one number still finds your family.
  - **Lost at the store:** A clerk can dial the number with them, and the call starts looking for family straight away.
  - **When plans change:** Practice ran late? One call reaches whoever can come.
- **Animation:** a pinned horizontal gallery of four illustrated scenes, with the backpack tag travelling from scene to scene.

**7. Simulator (`#build`)**
- **H2:** Build the circle that answers for your child.
- **Pre-filled contacts:** Mom, Dad, Grandma Rose.
- **Tip:** Mark someone Busy to watch the call skip ahead.

**8. Features (`#features`)**
- **H2:** Built so a call finds someone who loves them.
- **Tiles:**
  - **One number to learn.**
  - **No phone of their own needed.**
  - **It keeps going:** if you're busy, it rolls to your partner, then a grandparent, then a neighbour.
  - **Hand it off:** whoever answers can press \* to pass the call to someone else in the circle.
  - **Your voice first:** a greeting they recognise, and "Press 1 for Mom" in your own voice.
  - **You'll know:** a call log that includes missed attempts, and voicemails sent to you as text.
  - **Private and protected.**

**9. Pricing**
- **H2:** Peace of mind, for less than a phone bill.
- **Plan taglines:**
  - Essential: "One number, three grown-ups."
  - Pro: "Room for six grown-ups per number."
  - Care Team: "Several kids, or a second caregiver login."

**10. FAQ (`#faq`)**
- **H2:** What parents ask us most.

1. **Does my child need their own phone?** No, that's the whole idea. iCanCall works from any phone: a friend's house, the school office, a neighbour's landline.
2. **What does my child actually have to do?** Dial the number, then press 1 when the greeting asks. Practise a pretend call together a couple of times and it sticks. If you'd prefer no key press at all, turn on direct connect, and the call rings the family right after the greeting.
3. **Isn't one number too simple for something urgent?** Simple is what works under stress. A child never has to decide who to call. For life-threatening emergencies, always teach your child to call 911 too.
4. **What if I'm busy and can't pick up?** The call rolls to the next grown-up until someone answers. You'll see it in your call log, and if no one picked up, their message reaches you by email and text.
5. **Can I change who's in the circle, or the order?** Anytime, in seconds, from your dashboard. Changes apply to the very next call.
6. **Will strangers see our phone numbers?** Never. Everyone's personal numbers stay hidden behind your iCanCall line, and we never sell your data.
7. **How do I help my child remember the number?** Turn it into a rhyme or a song, and put it on a backpack tag and the school form. Within a week, it's theirs.

**12. Final CTA**
- **H2:** Give them one number. Give yourself peace of mind.
- **Lead:** In a few minutes, your child will have one number that finds a grown-up who loves them, from any phone. No device, no contact list, no guessing.

**Footer blurb:** One memorable number that connects your child to a grown-up who loves them, from any phone.

**Imagery**
- Use `child-calling.png` in the hero or chapter one.
- Draw the rest as inline SVG: the backpack tag, the fridge note and the four scenes.
- No school names, no location details, nothing that identifies a real child.

## 7C. For Caregivers (`public/caregivers.html`)

**Setup**
- **Reader:**
  - parents and family caregivers of teens and adults with developmental, cognitive or physical disabilities;
  - co-caregivers, day programs, group homes and case managers.
- **Emotional core:** independence for the loved one, and certainty for the care team.
- **Tone:** respectful and matter-of-fact. Show the loved one as capable. No pity.
- **Cast:**
  - Daniel, aged 24, is the caller.
  - The care team is Maria · Mom, primary caregiver (the account owner), James C. · Co-caregiver, Sunrise Program · Day program and Nurse Dawn · On-call.
- **Number card:** (415) 200-CARE, labelled "Daniel's iCanCall number".
- **Signature visual:** **the One Button**, a large, tactile round speed-dial button like the one on an adaptive big-button phone. A press sends out a soft ripple, and the care team lights up in order.
- **Primary CTA:** "Get started".
- **Nav:** The care team (`#coverage`) · How it works (`#how`) · Try it (`#build`) · Pricing (`#pricing`) · Questions (`#faq`).
- **Direct connect:** on in the story, and on by default in the simulator. Recommend it on this page.
- **Low-stimulation motion:**
  - Make durations 1.2× longer.
  - Run no more than one animation at a time in any view.
  - Use soft fades and gentle translations.
  - Keep pulses subtle, with no bright flashes.

**1. Hero**
- **Eyebrow:** For families & caregivers of loved ones with special abilities
- **H1:** One press. The whole care team behind it.
- **Lead:** For someone who can't work through a contact list, one number, or one speed-dial button, reaches the care team you choose, in the order you choose, until someone who knows them picks up.
- **Note under the CTAs:** No list to navigate and no one to choose. With direct connect on, there's nothing else to press: the call rings the team right after the greeting.
- **Visual:** the One Button, surrounded by the care team.

**2. Trust strip**
- **Label:** Independence for them, reassurance for you
- **Stats:** 1 press to reach the team · 0 lists to navigate · Works with speed dials and adaptive callers · 2 caregiver logins on Care Team

**3. Chapter one (`#coverage`)**
- **Eyebrow:** The care team
- **H2:** Someone on the team is always next.
- **Body:** The number never changes, and neither does the plan. You decide who's reached first, second and third: family, a co-caregiver, the day program, an on-call nurse. The call moves down the list until someone answers. Any phone number can be on the team, including a group-home line or a case manager.
- **Scroll animation, scrubbed:**
  1. A vertical relay of the care-team cards.
  2. Maria's card is marked "Busy · at work", and the call visibly skips past her.
  3. The call passes to James, who answers.

**4. The call story (`#how`): "Daniel wants to talk to someone he knows."**
1. **Daniel presses his one button.** It's programmed on his phone, tablet or adaptive caller, and it's the only button he needs.
2. **Maria's voice answers first.** "Hi Daniel, it's Mom. I'm finding someone for you." Direct connect is on, so there's nothing else to press.
3. **Maria's marked Busy while she's at work, so the call skips to James.**
4. **James picks up.** He knows Daniel, and he knows what to do. If Daniel needs someone else, James presses \* and passes the call along, and Daniel never has to hang up.
5. **Nothing slips through.** If no one can answer, the call goes to voicemail and Maria gets the transcript by email and text. The call log shows every attempt.

**5. Setup (`#setup`)**
- **H2:** You build the care team. They make one call.

1. **Claim one number.** Set it as a speed dial or a one-touch button on the phone, tablet or adaptive caller they already use.
2. **Build the care team.** Add family, co-caregivers, a day program, a group home or an on-call nurse, in order. That's up to 6 people per number on Pro, and 15 on Care Team.
3. **Make it one press.** Turn on direct connect, record a greeting in a voice they know, then practise the call together until it feels familiar.

**6. Moments (`#devices`)**
- **H2:** Fits the way they already call.
- **Three device cards:**
  - a speed dial on a basic phone;
  - a tablet that can make calls;
  - an adaptive big-button caller.
- **Animation:** the same number is pressed on each card in turn.

**7. Simulator (`#build`)**
- **H2:** Build the care team that answers.
- **Pre-filled contacts:** Maria (Mom · primary), James C. (Co-caregiver), Sunrise Program (Day program).
- **Tip:** Mark a caregiver Busy to watch the call skip ahead.

**8. Features (`#features`)**
- **H2:** Simple for them. Complete for you.
- **Tiles:**
  - **One press, one routine:** with direct connect, the speed-dial press is the whole interaction.
  - **The team, in order.**
  - **Hand-offs mid-call:** press \* to pass the call to someone else.
  - **A voice they know:** a recorded greeting, and caller-menu names in your own voice.
  - **Nothing slips through:** voicemail transcripts by email and text, and a call log that includes missed attempts.
  - **Share the load:** Care Team adds a second caregiver login, up to 15 people per number, and 5 numbers for several loved ones.
  - **Private by design.**

**9. Pricing**
- **H2:** Simple pricing for the whole care team.
- **Badges:** on this page, Care Team gets an extra "Built for care teams" badge, and Pro keeps "Most popular".
- **Plan taglines:**
  - Essential: "One number for one loved one."
  - Pro: "Room for the whole care team."
  - Care Team: "Shared caregiving, with a second caregiver login."

**10. FAQ (`#faq`)**
- **H2:** What caregivers ask us most.

1. **My loved one is non-verbal. Does this still help?** Yes. After dialling, they don't need to say or press anything. Turn on direct connect, and the call rings the care team right after the greeting. Your call log shows every call, including ones that didn't connect.
2. **Can it be a single speed-dial button or an adaptive device?** Yes. It's just a phone number, so it works on anything that can dial one.
3. **How do multiple caregivers work?** Add everyone to the team in order, and mark people Busy when they're off. The Care Team plan adds a second caregiver login, so you can share the dashboard.
4. **What if the first caregiver can't pick up?** The call moves to the next person until someone answers. If no one does, it goes to voicemail, and you get the transcript by email and text.
5. **Can a group home or day program be on the team?** Yes. Any phone number can be a contact.
6. **Can the person who answers bring in someone else?** Yes. They press \* and transfer the call to another member of the team.
7. **Does direct connect let spam calls through?** Yes, it can. With direct connect on, every call rings the team. If robocalls become a problem, turn it off, and callers press 1 first.
8. **Is iCanCall a medical alert or emergency service?** No. It complements, but doesn't replace, 911 or a medical-monitoring service.
9. **Is our information private?** Yes. Every caregiver's personal number stays hidden, and we never sell your data.

**12. Final CTA**
- **H2:** Independence for them. Certainty for you.
- **Lead:** Give your loved one the independence of reaching help on their own, and give your care team one simple way to be there. Set up in minutes.

**Footer blurb:** One memorable number, or one button, that connects your loved one to their care team.

**Imagery**
- Use `special-abilities.png` in the hero or chapter one.
- Draw the rest as inline SVG: the One Button, the care-team relay and the device cards.
- Show people with disabilities as candid and capable.

# 8. Verify before you finish each page

**Code checks**
- `npm run lint` and `npm run build` both pass.

**In the browser**
- Run `npm run dev` and open the page.
- `next dev` rewrites the Next.js block at the top of `AGENTS.md`. Revert it before committing (`git checkout -- AGENTS.md`).
- Take Playwright screenshots at **390×844** and **1440×900** of:
  - the hero;
  - each pinned section at 25%, 50% and 75% of its scroll;
  - the simulator in its idle, ringing, Busy-skip, connected, voicemail and caller-menu states, with direct connect on and off;
  - pricing on monthly and on annual;
  - the footer.
  - If Playwright's browser isn't installed, say so rather than downloading one without asking.
- Repeat the screenshots with `prefers-reduced-motion: reduce` emulated.
- There are no console errors and no horizontal scroll at 390px.

**Accessibility and robustness**
- You can Tab through the header, the language selector, the simulator (including reordering contacts), the pricing toggle and the FAQ, with a visible focus ring throughout.
- With JavaScript disabled, all copy is readable and the pricing shows the monthly prices.
- Spot-check Spanish and Arabic. Arabic must flip to right-to-left, including the direction of the animations.

**Guardrails**
- Search the finished file for banned phrases and emoji: "everyone gets a text", "whole team alerted", "24/7", "around-the-clock", "encrypted", "free trial", "right away", "in seconds", and any character in the emoji ranges.
- Every "nothing to press" or "just dials" line must sit in a section that mentions direct connect.

# 9. Ship

**Commits**
- Commit each page separately on a new branch, with a clear message.
- Don't push or open a pull request unless I ask.

**Standalone sync (from `AGENTS.md`)**
- Copy each finished page to its root mirror: `iCanCall Seniors Landing (standalone).html`, `iCanCall Parents Landing (standalone).html` and `iCanCall Caregivers Landing (standalone).html`.
- Also copy them to the pCloud and Google Drive folders listed in `AGENTS.md`.
- If those folders don't exist on this machine, say so and skip them.

**Report back**
- What changed.
- The screenshots.
- Anything you couldn't verify.
- Any copy claim you weren't sure the code supports.

---

## Appendix: hold until time-of-day routing works (do not paste yet)

The dashboard lets Pro and Care Team owners choose "Around-the-clock coverage", but `src/app/api/twilio/voice/route.ts` doesn't use the schedule yet. A schedule-mode line currently behaves like Call Cascade. Once calls really do route by time of day, give Claude Code this follow-up:

> Add time-of-day routing to the three audience pages in `public/`:
>
> - **Caregivers `#coverage`**
>   - Retitle the section "Someone is always responsible."
>   - Add a 24-hour coverage timeline with a draggable "now" marker. It shows who answers at each hour: Sunrise Program on weekdays, Maria in the afternoons, James C. in the evenings and Nurse Dawn overnight.
>   - If the assigned person can't answer, the call cascades to the rest of the team.
> - **Seniors and Parents features:** add a "Different by time of day" tile. For example: the sitter after school and you in the evening, or the night caregiver after hours.
> - **Simulators:** add an "Around the clock" routing mode with a simulated-time slider.
> - **Pricing:** add "Time-of-day scheduling" to Pro and Care Team.
> - **Guardrails:** remove the time-of-day ban from §6.
> - Update the draft translations, verify and sync as before.
