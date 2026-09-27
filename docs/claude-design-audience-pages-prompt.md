# Claude Design prompt: iCanCall audience pages (/seniors, /parents, /caregivers)

> Paste everything between the two lines into Claude Design. If you can, use the same project as the new homepage, and attach the **iCanCall design system** first. The appendix at the bottom is **not** for pasting yet.

---

Redesign iCanCall's three audience landing pages: **For Seniors** (`/seniors`), **For Parents** (`/parents`) and **For Caregivers** (`/caregivers`).

These pages are siblings of the new icancall.co homepage. They should share its premium, scroll-animated craft, its components and its call simulator. But each page tells its own story, to its own reader, with its own cast of characters.

**Build one page at a time, in this order: Seniors, then Parents, then Caregivers.** Finish and show each page before starting the next. Build the shared modules (Part 1) once and reuse them. If the homepage design already exists in this project, reuse its header, simulator, pricing, FAQ and footer instead of redrawing them.

# Part 1: What all three pages share

## 1.1 Product facts (build only on these)

**The number**
- iCanCall gives each loved one **one memorable phone number**. Families usually get a local number, and sometimes one that spells a word like CARE or HOME.
- It can be dialled from any phone: a landline, a flip phone, a smartphone, a tablet that can make calls, an adaptive big-button caller or a speed-dial button.
- The caller needs no app, no account and no new device.

**What the caller hears**
- A short greeting plays first. It can be a natural-sounding voice (there are 8 to choose from), or **a message the family records themselves**.
- Then the caller **presses 1 to reach the family**, or 2 to leave a message.
- In Caller menu mode, the caller hears "Press 1 for Maria, press 2 for Joseph…" instead, with each name in the family's own recorded voice.
- *Be honest about this one key press, and show it in the stories.*

**How it rings (routing)**
- **Call Cascade:** one person at a time, in the order you choose. Each person rings for about 15 seconds before the call moves on.
- **Ring everyone:** all contacts at once.
- **Caller menu:** the caller picks who to reach.
- The Essential plan uses Call Cascade only. Pro and Care Team unlock all three modes.

**During the call**
- Each contact can be marked **Busy** or **Available**. Busy contacts are skipped.
- Whoever answers can **press \* to hand the call to another person in the circle**, without the caller hanging up.

**If no one answers**
- The caller leaves a voicemail.
- It's transcribed and sent to **the account owner** by email and text.

**The dashboard**
- Add and reorder contacts, and mark people Busy or Available.
- Choose the routing mode and the greeting.
- See a call log that shows every call, including missed attempts.
- Sign-in is protected by a two-step SMS code.
- The Care Team plan adds a **second caregiver login**.

**Trust**
- Personal numbers stay hidden behind the one iCanCall line, and we never sell your data.
- Setup takes under five minutes.
- 30-day money-back guarantee, no contracts, no setup fees.
- iCanCall is **not** an emergency or medical-alert service. Always call 911 in an emergency.

## 1.2 Look and feel

- **Overall:** premium, calm, warm and trustworthy. Think the scroll pacing of an Apple product page, the craft of Stripe's illustrations, and the warmth of a family photo on the fridge.
- **Brand system:** use the design-system tokens throughout (hex values in case a token is missing):

| Token | Hex |
|---|---|
| `--bg` | #f9fdff |
| `--surface` | #ffffff |
| `--tint` | #e7f7fc |
| `--tint-2` | #d8f2f7 |
| `--line` | #d6e0e4 |
| `--ink` | #192531 |
| `--ink-soft` | #4b5761 |
| `--blue` (primary buttons) | #0f85b2 |
| `--blue-deep` | #005886 |
| `--blue-ink` (immersive dark chapters) | #003b60 |
| `--teal` | #50b7b8 |
| `--teal-deep` | #1c989c |
| `--green` (connected only) | #4ab67f |
| `--rose` (missed only, sparingly) | #dd4c5c |

- **Signature gradient:** `linear-gradient(150deg, --blue-deep, --blue 55%, --teal-deep)`.
- **Rhythm:** mostly light, airy sections, with two immersive deep-navy chapters: the call story and the final CTA.
- **Page accents:** each page gets one accent colour, used for illustration fills and highlights. It is never used for body text. Seniors uses `--blue-deep`, Parents uses `--teal` and Caregivers uses `--teal-deep`. Links and buttons stay on the brand blue everywhere.
- **Type:** use the design-system stack (`--font`), with weight 700 headlines, −0.025em tracking and sentence case. Every phone number, timer and price uses `--mono` with tabular numerals.
- **Craft:** 120 to 160px of section spacing on desktop, a 1180px max width, 24 to 32px radii, soft layered shadows and 1px hairlines. The header turns frosted glass on scroll.
- **Never use:**
  - emoji anywhere, including the language selector. Use a custom SVG icon set with a 1.5px stroke and round caps;
  - generic blob gradients or stock illustration packs;
  - auto-advancing carousels, countdowns or fake scarcity;
  - scroll-jacking.

## 1.3 Shared page skeleton

Every page follows this order. Part 2 gives the content that is specific to each page.

| # | Section | Journey stage | Anchor |
|---|---|---|---|
| 0 | Sticky header | — | — |
| 1 | Hero | attention | — |
| 2 | Trust strip | reassurance at a glance | — |
| 3 | Chapter one: the audience's problem | recognition | page-specific: `#noapp`, `#lesson` or `#coverage` |
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

Keep every anchor ID listed above, because existing links point to them.

## 1.4 Shared modules

**Header**
- Logo mark plus the "iCanCall" wordmark, linking to `/`.
- Four page-specific nav links.
- A language selector showing language names with no flags: English, Español, Français, 日本語, 中文, العربية, हिन्दी, Português, Deutsch, Italiano, 한국어.
- A ghost button, "See how it works", and the page's primary CTA button.
- On mobile, a sticky bottom CTA bar appears after the hero.

**Hero call animation.** It plays once on load, over about 2.5 seconds:
1. The page's number card types in.
2. A signal pulse radiates from the card.
3. The first contact rings, then dims with the label "No answer".
4. The second contact turns green with "Connected · 0:04".
5. The scene breathes gently for a few cycles, then rests.

The hero H1 is visible at first paint and never fades in.

**Pinned call story (`#how`)**
- An immersive deep-navy chapter, 300 to 400vh tall.
- Left: the step copy, which changes with scroll.
- Right: the page's signature visual, with a glowing "call thread" travelling from the caller to the circle.
- A progress rail marked 1 to 5, and a mono call timer that fast-forwards.
- Contact states: ringing (a teal pulse), no answer (dim grey), Busy (skipped, shown with a small "Busy" label and a jump-over arc), connected (a steady green glow) and voicemail (a waveform that turns into a transcript card that types itself out).
- Reduced motion: five static stacked steps, each with its own illustration.

**Setup (`#setup`)**
- Three step cards, with a connecting line that draws itself as they enter.
- The cards rise one after another with an 80ms stagger.

**Simulator (`#build`)**
- **Routing mode:** a segmented control for Call Cascade, Ring everyone and Caller menu, with a note: "Ring everyone and Caller menu are on Pro and Care Team."
- **The circle:** three pre-filled contacts from the page's cast. Names can be edited inline. Visitors can add contacts up to six and drag to reorder. Each contact has an Available / Busy toggle.
- **"Place a test call":** runs the call. It shows the greeting and the press of 1 first, then the routing. The status is announced through `aria-live`, for example: "Greeting… Pressed 1. Ringing Sarah… No answer. Ringing David… Connected."
- **"What if no one answers?":** a switch that plays the voicemail path and ends on a transcript card, labelled "Sent to you by email and text".
- **End state:** a CTA card with the page's primary CTA.
- Fully keyboard-operable. On mobile, the contacts stack vertically.

**Features bento (`#features`)**
- Six or seven tiles.
- Each tile has a small product render built from design-system components (`ContactRow`, `LogRow`, `Toggle`, `StatCard`) with the page's own cast.
- Each tile has one micro-animation that plays once when it enters the viewport.

**Peace-of-mind band.** It sits directly above pricing:
- Five quiet trust points, each with an SVG icon:
  1. 30-day money-back guarantee
  2. No contracts, no setup fees
  3. Personal numbers stay private, and we never sell your data
  4. Two-step sign-in
  5. Real people answer support within one business day
- A testimonial slot with three cards. Fill every card with visible placeholder text only: "[Real customer quote]" · "[Name, relationship]". Never invent quotes or names.
- A small disclaimer: "iCanCall helps your family reach each other fast. It isn't a medical alert or emergency service. In an emergency, always call 911."

**Pricing (`#pricing`)**
- A Monthly / Annual toggle with a "Save 17%" badge. Prices tween when the toggle changes.
- Sub-line: "Every plan works on any phone and includes voicemail transcripts by email and text. No setup fees, cancel anytime."
- The plans (use the page's tagline overrides from Part 2):

| Plan | Monthly | Annual | Includes |
|---|---|---|---|
| **Essential** | $14.99/mo | $149/yr ("Just $12.42/mo, billed annually") | 1 dedicated number · up to 3 trusted contacts · Call Cascade · 30 voice minutes a month |
| **Pro** (badge: "Most popular") | $24.99/mo | $249/yr ("Just $20.75/mo…") | 2 dedicated numbers · up to 6 contacts per number · Cascade, Ring everyone and Caller menu · 60 voice minutes a month |
| **Care Team** | $49.99/mo | $499/yr ("Just $41.58/mo…") | 5 dedicated numbers · up to 15 contacts per number · all routing modes · 150 pooled voice minutes a month · 2 caregiver logins |

- Plan CTAs: "Choose Essential", "Choose Pro" and "Choose Care Team". Each links to `/signup?plan=essential|pro|careteam&billing=monthly|annual`, with the billing value following the toggle.
- Below the plans:
  - "Need more? Extra numbers $3.99/mo each · Extra minutes $4.99 per 30."
  - "See how we compare" → `/comparison-chart`.

**FAQ (`#faq`)**
- An accordion with one item open at a time and a smooth height transition.

**Also made for (`#usecases`)**
- Two compact photo cards linking to the other two audience pages, plus a text link: "For every family → /".
- The photos are `child-calling.png` (Parents), `aging-parent.png` (Seniors) and `special-abilities.png` (Caregivers).

**Final CTA (`#cta`)**
- A deep-navy chapter with the signature gradient glow.
- A bookend to the hero: the number card returns, the circle closes around it, a green "Live" dot appears and every contact is connected.
- The page's primary CTA, plus a secondary "Talk to a real person" → `/contact`.
- Fine print: "Set up in minutes · No setup fees · Cancel anytime".

**Footer**
- Logo and the page's blurb.
- **Product:** How it works, Pricing, FAQ, Compare.
- **Who it's for:** Parents, Seniors, Caregivers.
- **Company:** For every family (`/`), Contact.
- **Legal:** Privacy, Terms.
- Bottom row: "© 2026 iCanCall, Inc." · "Made for the moments that matter." · a space for the ElevenLabs Grants badge.
- Do not include About, Careers or Security links. Those pages don't exist.

## 1.5 Motion system

- **Easing and timing:**
  - Entrances use `cubic-bezier(0.22, 1, 0.36, 1)`.
  - Scrubbed transitions use `cubic-bezier(0.65, 0, 0.35, 1)`.
  - Durations are 400 to 900ms, with a 60 to 80ms stagger.
- **Properties:** animate only `transform`, `opacity`, `clip-path` and `filter`.
- **Techniques:**
  - CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`) inside `@supports`, with an IntersectionObserver fallback.
  - Pinned sequences use `position: sticky`, with progress calculated in `requestAnimationFrame`.
  - No animation library.
  - Never change the native scroll speed.
- **Restraint:**
  - Every animation shows something true about the product: a call travelling, someone answering, a message turning into text.
  - At most one subtle parallax layer per section.
  - Nothing loops indefinitely.
  - No flashing, ever.
- **Reduced motion:** `prefers-reduced-motion` gets simple fades or static end states. Pinned sections become stacked steps.
- **Horizontal pinned galleries** are for desktop only. On mobile they become vertical stacks with reveals.

## 1.6 Voice and claim guardrails

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
- that there is literally "nothing to learn" or that it takes "one press" end to end. The caller dials, then presses 1;
- that "a familiar voice answers right away" or that family is reached "in seconds";
- uptime figures, encryption claims ("encrypted", "end-to-end", "bank-level"), HIPAA or SOC 2;
- a free trial;
- AI call screening;
- a medical-alert or emergency service;
- superlatives such as "the only…";
- any named testimonial.

## 1.7 Build and handoff

**Format**
- Deliver each page as a **standalone HTML export**, like the current audience pages. They will replace `public/seniors.html`, `public/parents.html` and `public/caregivers.html`.
- Keep the shared design-system class names (`.wrap`, `.section`, `.tint-band`, `.eyebrow`, `.lead`, `.card`, `.hero`, `.trust`, `.cta-band`, `.footer`). Never rename existing classes.

**Translation**
- Translation is added after export, using a dictionary keyed by the **exact English strings**.
- Keep every sentence whole inside a single element. If you animate word by word, split the words at runtime with JavaScript, not in the markup.
- Don't put text inside SVGs or images.

**Quality bars**
- All content renders without JavaScript.
- Lighthouse performance of 90+ on mobile, LCP under 2.5s, CLS under 0.05, and a smooth 60fps scroll on a mid-range phone.
- WCAG 2.2 AA: text contrast of 4.5:1 or better, visible focus rings, and tap targets of 44px or more.
- Layouts absorb about 35% text expansion (German), mirror cleanly for Arabic right-to-left (including the direction of the animations), and handle CJK line heights.
- Breakpoints: 390, 768, 1280 and 1440+.

# Part 2: The three pages

Section numbers match the skeleton in 1.3. Any section not listed for a page (such as 11, the cross-links) uses the shared module from 1.4 as is.

## 2A. For Seniors (`/seniors`), build this first

**Setup**
- **Reader:** an adult child, aged 40 to 65, whose parent is 70 or older and often lives apart from them. They are worried, but they respect their parent's independence.
- **Emotional core:** dignity. The parent keeps their routine, and the family gets peace of mind.
- **Cast:**
  - Mom is the caller.
  - The circle is Sarah R. · Daughter (the account owner), David M. · Son, Lena N. · Neighbor and June · Mom's sister.
- **Number card:** (415) 200-CARE, labelled "Mom's iCanCall number".
- **Signature visual:** the kitchen landline and a note on the fridge. The phone's **coiled cord** uncoils into the glowing call thread that travels to the family.
- **Primary CTA:** "Set it up for them".
- **Nav:** Nothing to install (`#noapp`) · How it works (`#how`) · Try it (`#build`) · Pricing (`#pricing`) · Questions (`#faq`).
- **Readability:** readers here skew older. Use 19px body text, 52px-tall buttons, and aim for AAA contrast on body copy.

**1. Hero**
- **Eyebrow:** For families with aging parents
- **H1:** Mom can always reach you. On the phone she already uses.
- **Lead:** Give your parent one easy number that quietly finds the whole family, one person after another, until someone picks up. No app to install and no new device to charge. You set it up in minutes; she just dials.
- **Note under the CTAs:** You do the setup. Works on a landline, a flip phone or a smartphone.
- **Visual:** a landline handset on a side table, beside a fridge-note card reading "(415) 200-CARE · Family".
- **Hero animation:** Sarah shows "No answer", then David shows "Connected".

**2. Trust strip**

0 apps to install · 0 new devices to charge · 1 number on the fridge · Any phone she already has

**3. Chapter one (`#noapp`)**
- **Eyebrow:** No app · No new device
- **H2:** Nothing to install, charge or wear.
- **Body:** The hardest part of most safety gadgets is getting a parent to use them. iCanCall lives on the phone that's already by her chair. The only new things are one number, and one press when the greeting asks.
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
2. **A voice she knows answers first.** Sarah recorded the greeting: "Hi Mom, it's Sarah. Press 1 and I'll find one of us." Mom presses 1.
3. **It rings Sarah.** She's in a meeting, so after a few rings the call moves on by itself.
4. **David picks up.** "Hi Mom." That's all it takes.
5. **If no one can answer, nothing is lost.** Mom leaves a message, and Sarah gets it as text, by email and SMS, so she can call straight back.

**5. Setup (`#setup`)**
- **H2:** You set it up. She just dials.
- **Lead:** Three quiet steps, all on your side.

1. **Claim her number.** Pick a local number, sometimes one that spells a word like CARE or HOME. Put it on the fridge, set it as a speed dial, or save it as "Family".
2. **Add the family circle.** You, your siblings and a trusted neighbour, in the order you want them reached. You manage it all from your phone, and nothing is installed on hers.
3. **Practise one call together.** Show her the greeting and the one press. After that, it's just a phone call.

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
3. **Does she have to learn anything new?** Just the number, and one press. When she calls, a short greeting asks her to press 1 to reach the family. You manage everything else from your dashboard.
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
- **Shot list:**
  - hands dialling a corded kitchen landline;
  - the fridge note under a magnet;
  - a daughter glancing at her phone in a meeting;
  - a son answering hands-free in a parked car.
- Always dignified. Never frail, confused or alone in the dark.

## 2B. For Parents (`/parents`)

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
2. **What does my child actually have to do?** Dial the number, listen to the short greeting, and press 1. Practise a pretend call together a couple of times and it sticks.
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
- **Shot list:**
  - a child on tiptoes dialling a kitchen wall phone;
  - a close-up of the backpack tag;
  - a store clerk kindly helping a child dial;
  - Grandma answering in her garden.
- No school names, no location details, nothing that identifies a real child.

## 2C. For Caregivers (`/caregivers`)

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
- **Low-stimulation motion:**
  - Make durations 1.2× longer.
  - Run no more than one animation at a time in any view.
  - Use soft fades and gentle translations.
  - Keep pulses subtle, with no bright flashes.
  - Readers may be sensory-sensitive or cognitively fatigued.

**1. Hero**
- **Eyebrow:** For families & caregivers of loved ones with special abilities
- **H1:** One number. The whole care team behind it.
- **Lead:** For someone who can't work through a contact list, one number, or one speed-dial button, reaches the care team you choose, in the order you choose, until someone who knows them picks up.
- **Note under the CTAs:** No list to navigate and no one to choose. After a short greeting, one key press starts the call.
- **Visual:** the One Button, surrounded by the care team.

**2. Trust strip**
- **Label:** Independence for them, reassurance for you
- **Stats:** 1 number for the whole team · 0 lists to navigate · Works with speed dials and adaptive callers · 2 caregiver logins on Care Team

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
2. **Maria's voice answers first.** She recorded the greeting: "Hi Daniel, it's Mom. Press 1 and I'll find someone." He presses 1, just like they practised.
3. **Maria's marked Busy while she's at work, so the call skips to James.**
4. **James picks up.** He knows Daniel, and he knows what to do. If Daniel needs someone else, James presses \* and passes the call along, and Daniel never has to hang up.
5. **Nothing slips through.** If no one can answer, the call goes to voicemail and Maria gets the transcript by email and text. The call log shows every attempt.

**5. Setup (`#setup`)**
- **H2:** You build the care team. They make one call.

1. **Claim one number.** Set it as a speed dial or a one-touch button on the phone, tablet or adaptive caller they already use.
2. **Build the care team.** Add family, co-caregivers, a day program, a group home or an on-call nurse, in order. That's up to 6 people per number on Pro, and 15 on Care Team.
3. **Practise together.** Record a greeting in a voice they know, then practise the call and the one key press until it feels familiar.

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
  - **One number, one routine.**
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

1. **My loved one is non-verbal. Does this still help?** They don't need to say anything. After dialling, one key press (1) starts the call through the care team, so practise it together. Your call log shows every call, including ones that didn't connect. If a key press is hard for them, talk to us.
2. **Can it be a single speed-dial button or an adaptive device?** Yes. It's just a phone number, so it works on anything that can dial one.
3. **How do multiple caregivers work?** Add everyone to the team in order, and mark people Busy when they're off. The Care Team plan adds a second caregiver login, so you can share the dashboard.
4. **What if the first caregiver can't pick up?** The call moves to the next person until someone answers. If no one does, it goes to voicemail, and you get the transcript by email and text.
5. **Can a group home or day program be on the team?** Yes. Any phone number can be a contact.
6. **Can the person who answers bring in someone else?** Yes. They press \* and transfer the call to another member of the team.
7. **Is iCanCall a medical alert or emergency service?** No. It complements, but doesn't replace, 911 or a medical-monitoring service.
8. **Is our information private?** Yes. Every caregiver's personal number stays hidden, and we never sell your data.

**12. Final CTA**
- **H2:** Independence for them. Certainty for you.
- **Lead:** Give your loved one the independence of reaching help on their own, and give your care team one simple way to be there. Set up in minutes.

**Footer blurb:** One memorable number, or one button, that connects your loved one to their care team.

**Imagery**
- Use `special-abilities.png` in the hero or chapter one.
- **Shot list:**
  - a young man pressing the big button on an adaptive phone at a day program;
  - a co-caregiver answering in a bright kitchen;
  - two hands practising the one press together.
- Cast disabled talent authentically, and show them candid and capable.

# Part 3: Deliverables and definition of done

**For each page:**
1. A working prototype at **1440px desktop** and **390px mobile**, with the scroll animations and the simulator running.
2. Every simulator state: idle, greeting, ringing, no answer, Busy (skipped), connected, caller menu, hand-off and voicemail/transcript.
3. The reduced-motion version of the pinned call story.
4. A one-page **motion spec** giving the trigger, duration, easing and reduced-motion fallback for each section.
5. The shot list and the signature SVG illustration: the coiled cord, the backpack tag or the One Button.
6. A plain list of every visible English string on the page, to use as translation keys.

**Done means:**
- Each page reads as unmistakably part of the homepage's family, and unmistakably written for its own reader.
- A visitor can explain how iCanCall works, including the one key press, after the call story.
- Every section maps to one stage of the journey.
- Every animation shows something true about the product.
- The page's primary CTA is never more than one scroll away.

---

## Appendix: hold until time-of-day routing works (do not paste yet)

The dashboard lets Pro and Care Team owners choose "Around-the-clock coverage", but incoming calls don't use that schedule yet. It currently behaves like Call Cascade. Once calls really do route by time of day, send Claude Design this follow-up:

> Add time-of-day routing to the three audience pages:
>
> - **Caregivers `#coverage`**
>   - Retitle the section "Someone is always responsible."
>   - Add a 24-hour coverage timeline with a draggable "now" marker. It shows who answers at each hour: Sunrise Program on weekdays, Maria in the afternoons, James C. in the evenings and Nurse Dawn overnight.
>   - If the assigned person can't answer, the call cascades to the rest of the team.
> - **Seniors and Parents features:** add a "Different by time of day" tile. For example: the sitter after school and you in the evening, or the night caregiver after hours.
> - **Simulators:** add an "Around the clock" routing mode with a simulated-time slider.
> - **Pricing:** add "Time-of-day scheduling" to Pro and Care Team.
