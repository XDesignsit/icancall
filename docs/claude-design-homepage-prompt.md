# Claude Design prompt: iCanCall homepage (icancall.co)

> Paste everything below the line into Claude Design. Attach the **iCanCall design system** to the project first, so the tokens and components are available.

---

Design a new homepage for **icancall.co**. It should be a premium, scroll-animated marketing page that tells one clear story and turns visitors into subscribers.

Use the attached **iCanCall design system**: its colour tokens, radii, shadows, type scale and components. This page has to feel like the most polished page the brand has ever had, but it must still look like iCanCall.

## 1. The product in one breath

iCanCall gives a family **one memorable phone number**. When a loved one dials it, iCanCall rings the family's **circle of trusted contacts** until someone answers.

- **How it rings:** one after another (Call Cascade), all at once (Ring everyone), or through a spoken menu ("Press 1 for Maria, press 2 for Joseph").
- **The caller needs nothing new:** no app, no new device, no account. It works on any phone: a landline, a flip phone or a smartphone.
- **If nobody answers:** the caller leaves a voicemail. It is transcribed and sent to the account owner by email and text.
- **The family manages it** from a simple online dashboard. There they add contacts, mark someone Busy or Available, choose the routing, pick a greeting voice and see every call, including missed attempts.

**Positioning line:** *One number your loved one will never forget.*

## 2. Who we're talking to

The **buyer** is usually the organiser of the family: an adult child, a parent or a caregiver, often aged 35 to 60. They are protective, busy and short on time. They want something that *just works* for someone they love.

The page speaks to them directly as "you". There are three audiences, and each gets its own chapter:

1. **Parents of young children:** a child who can learn one number but not a contact list.
2. **Families with aging parents:** Mom or Dad keeps the phone they already know.
3. **Families and caregivers of loved ones with special needs:** one number or one speed-dial button reaches the care team.

Some visitors will be older adults themselves, so readability is not optional.

## 3. The six foundations, and how this page must deliver each one

| Foundation | What it means on this page |
|---|---|
| **Intentional design** | Every section has one job in the journey (see §5). Nothing decorative without a reason. One idea per screen, and a single accent colour per view. |
| **Clear customer journey** | The order is: attention, then recognition, then understanding, then belief, then fit, then confidence, then decision, then reassurance, then action. A visitor who only scrolls should still understand the product before they reach pricing. |
| **Visual storytelling** | The page follows **one call** from dial to answer. A signature visual, *the Circle*, carries the story from the hero to the final CTA. |
| **Strong copy** | Calm, plain and warm. Short sentences and concrete moments ("the number on the fridge"). Never clinical, never cute, never fear-selling. |
| **Custom imagery** | Bespoke SVG illustrations built on the logo's "joined figures" motif. Product UI renders made from real design-system components. Warm, candid photography of real homes. No stock clip-art. |
| **Meaningful interactions** | Every animation shows something true about the product: a call travelling, a contact answering, a voicemail becoming text. There is a hands-on demo where visitors build a circle and place a test call. |
| **Clear call to action** | One primary action everywhere: **Get started**, which scrolls to pricing and then opens signup. It sits in the hero and the sticky header, after the demo, at pricing and at the close. The secondary action is always "See how it works". |

## 4. Look and feel: premium, calm, trustworthy

**References:**
- the scroll pacing of an Apple product page;
- the craft of Stripe's product illustrations;
- the warmth of a family photo on the fridge.

**Colour.** Use the design-system tokens. Hex values are given in case a token isn't available.

| Role | Token | Hex |
|---|---|---|
| Page background | `--bg` | #f9fdff |
| Cards and surfaces | `--surface` | #ffffff |
| Soft blue wash for alternating bands | `--tint` | #e7f7fc |
| Deeper wash | `--tint-2` | #d8f2f7 |
| Hairline borders | `--line` | #d6e0e4 |
| Main text | `--ink` | #192531 |
| Secondary text | `--ink-soft` | #4b5761 |
| Primary buttons | `--blue` | #0f85b2 |
| Headline accent | `--blue-deep` | #005886 |
| Immersive dark chapters | `--blue-ink` | #003b60 |
| Supporting accent | `--teal` | #50b7b8 |
| Supporting accent, deeper | `--teal-deep` | #1c989c |
| Connected / answered only | `--green` | #4ab67f |
| Missed call only, used sparingly | `--rose` | #dd4c5c |

- Signature gradient: `linear-gradient(150deg, --blue-deep, --blue 55%, --teal-deep)`.
- Rhythm: mostly light, airy sections. Use one or two immersive deep-navy chapters for the call story and the final CTA, so the page has contrast and a sense of depth.

**Typography**
- Use the design system's type stack (`--font`), with weight 700 headlines, tight tracking (−0.025em) and large scale contrast.
- Use `--mono` with tabular numerals for every phone number, timer and price.
- Body text is at least 18px on desktop and 17px on mobile.
- Use sentence case for headlines.

**Craft details**
- Section spacing is generous: 120 to 160px on desktop.
- 12-column grid at the 1180px max width.
- Large radii (24 to 32px) on hero cards.
- Soft layered shadows from `--shadow-md` and `--shadow-lg`.
- 1px hairlines.
- A frosted-glass sticky header once the page scrolls.

**Avoid**
- Emoji anywhere. This includes the language selector, badges and status pills. Use custom SVG icons: a 1.5px stroke with round caps.
- Generic blob gradients and stock illustration packs.
- Auto-advancing carousels, countdown timers and fake scarcity.
- Scroll-jacking.

## 5. Page structure, section by section

Keep these anchor IDs, because existing links use them: `#how`, `#try`, `#features`, `#usecases`, `#pricing`, `#faq`.

### 0. Sticky header

- Logo mark plus the "iCanCall" wordmark.
- Navigation: How it works · Who it's for · Pricing · FAQ.
- A language selector showing language names (English, Español, Français, 日本語, 中文, العربية, हिन्दी, Português, Deutsch, Italiano, 한국어), with no flags.
- "Log in" (`/login`) and a primary **Get started** button.
- The header is transparent at the top, then shrinks and becomes frosted after about 80px of scroll.
- On mobile, a slim sticky bottom bar reading **Get started** appears once the hero leaves the viewport.

### 1. Hero: *attention*

- **Eyebrow:** Safety on autopilot
- **H1:** One number your loved one will never forget.
- **Lead:** iCanCall gives your family one easy phone number that rings your circle of trusted contacts, one after another, until someone picks up. It works on any phone, with no app and no new device.
- **CTAs:** **Get started** (→ `#pricing`) · See how it works (→ `#how`)
- **Trust line:** From $14.99/mo · 30-day money-back guarantee · No contracts

**Visual: "The Number".** A tactile card, like a note stuck on the fridge, shows **(415) 200-CARE** in large mono type, labelled "Mom's iCanCall number". Around it sits *the Circle*: four contact avatars on an orbit, with names and relationships (Maria · Daughter, Joseph · Son, Rosa · Grandma, Dan · Neighbor).

**Load animation** (about 2.5s, plays once):
1. The digits type in.
2. A soft signal pulse radiates from the card.
3. Maria's avatar lights up, then dims with "No answer".
4. Joseph's avatar turns green with "Connected · 0:04".
5. The scene breathes gently for a few cycles, then rests.

**Scroll animation:** as the visitor scrolls, the card lifts and travels with them into the next section, so it becomes the thread of the story.

### 2. The problem: *recognition*

- **H2:** Contact lists are hard. One number isn't.
- **Copy:** A six-year-old can't scroll through contacts. A parent with a fading memory may not find the right name. And when the first person is busy, the call shouldn't just stop there.

**Visual and scroll animation:**
- A stylised contact list of twelve or more names scrolls, blurs and collapses into the single number card. This is a morph that is scrubbed by scroll.
- The copy reveals line by line, from 30% to 100% opacity, scrubbed by scroll.

### 3. The story of one call (`#how`): *understanding*. **This is the signature section.**

- **Eyebrow:** How it works
- **H2:** One call. Your whole circle.

**Layout.** A pinned, immersive deep-navy chapter about 300 to 400vh tall.
- Left: step copy that changes as you scroll.
- Right: the Circle diagram, with a glowing "call thread" travelling between the caller and the contacts.
- A thin progress rail marked 1 to 5, and a mono call timer.

**Steps:**
1. **Mom dials the number she knows.** Any phone works: the landline in the kitchen, a flip phone, a smartphone.
2. **A warm greeting answers.** She hears a natural-sounding voice, or a message you recorded yourself. One press connects her to the family.
3. **It rings Maria first.** Maria's in a meeting, so the call moves on by itself. Nobody has to hang up and redial.
4. **Joseph picks up.** They're talking. That's the whole idea.
5. **If no one can answer, the message still gets through.** She leaves a voicemail. You get it transcribed, by email and text.

**Animation.**
- Scroll progress drives the call thread from step to step.
- The ring pulse on each avatar lasts about 15 "seconds" on the mono timer, which fast-forwards.
- States are ringing (teal pulse), no answer (dim grey, with a small "No answer" label), connected (green, with a steady glow) and voicemail. In the voicemail state, the waveform becomes a transcript card that types itself out.

**Reduced motion.** The pin is replaced by five static stacked steps, each with its own illustration.

### 3b. Setup: *understanding* (a compact section straight after the pin)

- **H2:** Set it up once. They just dial.
- **Lead:** Most families are set up in under five minutes. There's no hardware and no technician visit.

**Three steps:**
1. **Pick a number.** You get a local number, and sometimes one that spells a word like CARE or HOME.
2. **Build your circle.** Add the people who should answer and choose the order.
3. **Share it once.** Write it on the fridge, save it as a speed dial, and teach it once.

**Animation:** a connecting line draws through the three cards as they enter the viewport, and each card rises in turn with an 80ms stagger.

### 4. Try it (`#try`): *belief*. **This is the key interaction.**

- **Eyebrow:** Try it
- **H2:** Build a circle. Watch a call find its way.

**A working mini-simulator:**
- **Routing mode** is a segmented control with three options:
  - Call Cascade (one at a time, in order)
  - Ring everyone (all at once)
  - Caller menu ("Press 1 for Maria…")
- **The circle** starts with three contacts. Names can be edited inline. Visitors can add contacts up to six and drag to reorder. Each contact has a small Available / Busy toggle, taken from the design system's Toggle.
- **Place a test call** runs the animation for the chosen mode. Busy contacts are skipped.
- A status line announces each state through `aria-live`, for example "Ringing Maria… No answer. Ringing Joseph… Connected."
- A "What if no one answers?" switch plays the voicemail path and ends on a transcript card.

**Plan note:** Caller menu and Ring everyone are included on Pro and Care Team. Essential uses Call Cascade.

**Final state:** a CTA card reading "Give your family this circle." with **Get started**.

The simulator must be fully usable by keyboard and must work well on mobile, where the circle stacks vertically.

### 5. Who it's for (`#usecases`): *fit*

- **Eyebrow:** Who it's for
- **H2:** Made for the moments that matter.

**Layout and animation.** Three large editorial cards that stack as you scroll. Each card slides up over the one before, and the previous card scales to 0.96 and dims slightly. Each card has a photo, an audience label, a headline, two lines of copy, scenario chips and a text link.

**Kids** (link: "iCanCall for parents →" `/parents`)
- **Headline:** One number they'll never forget.
- **Copy:** Little ones can't memorise a contact list, but they can learn one number. It rings you, then your partner, then Grandma, until someone who loves them picks up.
- **Scenario chips:** Home after school · At a friend's house · When plans change

**Aging parents** (link: "iCanCall for seniors →" `/seniors`)
- **Headline:** Mom can always reach you, on the phone she already uses.
- **Copy:** No app to install and no new gadget to charge. One number on the fridge quietly finds the whole family.

**Special needs** (link: "iCanCall for caregivers →" `/caregivers`)
- **Headline:** One press. The right caregiver, every time.
- **Copy:** For someone who can't work through a contact list, one number or one speed-dial button connects them straight to the care team you choose.

### 6. Features (`#features`): *belief, in detail*

- **Eyebrow:** Why families choose iCanCall
- **H2:** Thoughtful by design. Dependable by default.

**Layout.** A bento grid. Each tile has a small product render built from real design-system components (`ContactRow`, `LogRow`, `Toggle`, `StatCard`) with realistic content, and a micro-animation that plays once when the tile enters the viewport.

| Tile | Copy | Micro-animation |
|---|---|---|
| **Works on any phone** | Landline, flip phone or smartphone. Nothing to install. | Three phone silhouettes light up in turn. |
| **Call Cascade** | Rings your circle in the order you choose, and moves on automatically. | |
| **Caller menu** | A spoken menu with each person's name in your own recording. | The "Press 1 for Maria" keypad press animates. |
| **Voicemail, transcribed** | Missed calls become messages you can read, by email and text. | A transcript types out. |
| **Your dashboard** | Add contacts, mark someone Busy, and see every call, including missed attempts. | Log rows slide in. |
| **A voice that sounds human** | Choose from natural-sounding greeting voices, or record your own. | A waveform plays. |
| **Private by design** | Everyone's personal number stays hidden behind your one iCanCall line. | |

### 7. Peace of mind: *confidence*

- **H2:** Peace of mind, built in.

**A row of five quiet trust points, each with an SVG icon:**
1. 30-day money-back guarantee
2. No contracts, no setup fees
3. Personal numbers stay private, and we never sell your data
4. Two-step sign-in protects your dashboard
5. Real people answer support, within one business day

**Testimonials.** Design a testimonial module with three cards, but fill every card with clearly marked placeholder text: "[Real customer quote goes here]" · "[Name, relationship]". Do not invent names or quotes.

**Small disclaimer:** iCanCall helps your family reach each other fast. It isn't a medical alert or emergency service. In an emergency, always call 911.

### 8. Pricing (`#pricing`): *decision*

- **Eyebrow:** Simple, transparent pricing
- **H2:** Peace of mind for less than a phone bill.
- **Sub:** Every plan works on any phone and includes voicemail transcripts by email and text. No setup fees, cancel anytime, and a 30-day money-back guarantee.

**Billing toggle:** Monthly / Annual, with a "Save 17%" badge. Prices tween smoothly when the toggle changes.

| Plan | Monthly | Annual | Tagline | Includes |
|---|---|---|---|---|
| **Essential** | $14.99/mo | $149/yr ("Just $12.42/mo, billed annually") | One number for one loved one. | 1 dedicated number · Up to 3 trusted contacts · Call Cascade · 30 voice minutes a month |
| **Pro** (badge: **Most popular**, visually elevated) | $24.99/mo | $249/yr ("Just $20.75/mo…") | Full protection for the whole circle. | 2 dedicated numbers · Up to 6 contacts per number · Cascade, Ring everyone and Caller menu · 60 voice minutes a month |
| **Care Team** | $49.99/mo | $499/yr ("Just $41.58/mo…") | Shared caregiving across several loved ones. | 5 dedicated numbers · Up to 15 contacts per number · All routing modes · 150 pooled voice minutes a month · 2 caregiver logins |

**Plan CTAs:** "Choose Essential", "Choose Pro" and "Choose Care Team". Each links to `/signup?plan=essential|pro|careteam&billing=monthly|annual`, with the billing value following the toggle.

**Below the plans:**
- A guarantee band: a 30-day money-back guarantee with a full refund, no questions asked, and no hardware to return.
- A quiet line: "Need more? Extra numbers $3.99/mo each · Extra minutes $4.99 per 30."
- "Organizations & teams: talk to us" → `/contact`.
- "See how we compare" → `/comparison-chart`.

### 9. FAQ (`#faq`): *reassurance*

- **H2:** Questions, answered.

**An accordion.** Only one item is open at a time, with a smooth height transition.

1. **Do I need any special hardware?** No. iCanCall is a phone number, not a device. Your loved one dials it from the phone they already have.
2. **How does the Call Cascade work?** Calls ring your contacts one at a time, in the order you choose. If someone doesn't answer, the call moves to the next person. If no one answers, the caller can leave a voicemail, and you'll get the transcript by email and text.
3. **Can I have more than one number?** Yes. Pro includes 2 numbers and Care Team includes 5. Extra numbers are $3.99/month each.
4. **Is there a setup fee or contract?** No setup fees, no activation costs, no contracts.
5. **What's your refund policy?** Every plan has a 30-day money-back guarantee. After that you can cancel anytime from your dashboard, and service runs to the end of your billing period.
6. **Does the guarantee cover annual plans?** Yes, for the first 30 days. After that, annual plans are non-refundable for unused months.
7. **Is my family's information private?** Yes. Personal numbers stay hidden behind your iCanCall line, and we never sell your data.
8. **How quickly can I get set up?** Most families are live in under five minutes: claim a number, add your contacts, done.
9. **Is iCanCall an emergency service?** No. It helps your family reach each other quickly and complements, but doesn't replace, 911 or a medical alert service.

### 10. Final CTA: *action*

**Layout.** An immersive deep-navy chapter with the signature gradient glow.

- **H2:** Give them one number. Give yourself peace of mind.
- **Lead:** Set up in under five minutes. Your family can start calling today.
- **CTAs:** **Get started** (→ `#pricing`) · Talk to a real person (→ `/contact`)
- **Fine print:** No setup fees · Cancel anytime · 30-day money-back guarantee

**Visual:** a bookend to the hero. The number card returns and the Circle closes around it, now at rest. It shows a green "Live" dot and every avatar is connected.

### 11. Footer

- Logo, and the blurb: "One memorable number that always connects to the people who matter most."
- **Product** column: How it works, Pricing, FAQ, Compare, Log in.
- **Who it's for** column: Parents, Seniors, Caregivers.
- **Company** column: Contact.
- **Legal** column: Privacy (`/privacy-policy`), Terms (`/terms-of-service`).
- Bottom row: "© 2026 iCanCall, Inc." · "Made for the moments that matter." · a space for the ElevenLabs Grants badge.
- Do not include About, Careers or Security links. Those pages don't exist.

## 6. Motion system

**Timing and properties**
- Easing is `cubic-bezier(0.22, 1, 0.36, 1)` for entrances and `cubic-bezier(0.65, 0, 0.35, 1)` for scrubbed transitions.
- Durations are 400 to 900ms, with a 60 to 80ms stagger.
- Animate only `transform`, `opacity`, `clip-path` and `filter`.

**Techniques**
- Use CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`) inside `@supports`, with an IntersectionObserver fallback.
- Pinned sequences use `position: sticky` plus scroll progress calculated in `requestAnimationFrame`.
- Do not use an animation library, and do not hijack native scroll speed.

**Restraint**
- At most one subtle parallax layer per section.
- Nothing loops indefinitely. The hero's idle pulse runs a few cycles, then rests.

**Accessibility**
- `prefers-reduced-motion` replaces every motion with a simple fade, or a static end state.
- Any animation longer than 5 seconds gets a pause control.

## 7. Custom imagery

**The Circle.** This is the signature illustration system. Derive it from the logo mark, an abstract group of three figures joined into one body.
- Contact avatars are soft circles with initials, or cropped portraits.
- They are joined by a fine glowing "call thread" line.
- Build everything as crisp, animatable inline SVG.

**Product renders**
- Use device frames: a cordless landline, a flip phone and a smartphone.
- Build dashboard crops from real design-system components with realistic content. For example: Maria Delgado · Daughter · (415) 555‑0142, and call-log rows such as "Mom → Joseph · Answered · 2:14".

**Photography**
- For the three audience chapters, use warm, naturally lit photos of home interiors with subtle teal and blue accents:
  - an older woman in an armchair with a mug;
  - a young child on a sofa talking on a phone;
  - a caregiver and a young woman with Down syndrome doing a puzzle together.
- If these assets aren't available, use tasteful placeholders labelled with this art direction.
- Art direction for all photography:
  - candid, not posed at the camera;
  - real homes and natural window light;
  - the phone visible in frame;
  - multigenerational and diverse families;
  - cool shadows with warm skin tones.
- Also deliver a short **shot list** for a future photo shoot.

**Icons.** A custom line set with a 1.5px stroke and round caps, drawn to one consistent 24px grid. Never emoji.

## 8. Copy rules and claim guardrails

**Voice**
- Calm, plain and warm.
- Speak to "you", the person setting it up.
- Use specific people and moments.
- Keep sentences short.
- Sentence case.
- Never use fear tactics.

**Use only these facts:**
- The pricing and plan limits above.
- The 30-day money-back guarantee.
- No contracts and no setup fees.
- Works on any phone, with no app.
- Set up in under five minutes.
- Local numbers, including some vanity numbers.
- Voicemail transcription by email and text.
- The routing modes as described above.
- Private numbers, and that we never sell data.
- Two-step sign-in.
- A support reply within one business day.

**Never claim or imply:**
- uptime percentages, or "under 3 seconds" speed stats;
- "end-to-end" or "bank-level" encryption;
- HIPAA or SOC 2 compliance;
- a free trial;
- AI call screening;
- that every contact gets a text alert;
- that it is a medical alert or emergency service;
- "the only service" or any other superlative;
- any named testimonial.

## 9. Build and handoff constraints

**Platform**
- The page will be implemented in a **Next.js 16 (App Router) + React 19** app, using **Tailwind v4 and the design system's CSS custom properties**.
- Reuse existing design-system classes (`.wrap`, `.section`, `.eyebrow`, `.lead`, `.card`) and components. Never rename existing classes.

**Performance**
- All content must render and be readable without JavaScript.
- The hero H1 is visible at first paint. Don't fade in the LCP element.
- Targets: Lighthouse performance of 90+ on mobile, LCP under 2.5s, CLS under 0.05, and 60fps scroll on a mid-range phone.

**Accessibility (WCAG 2.2 AA)**
- Contrast of 4.5:1 or better on all text.
- Visible focus rings.
- Tap targets of 44px or more.
- The simulator is fully keyboard-operable with ARIA labels.
- No text is baked into images.

**Internationalisation (11 languages)**
- Layouts must absorb about 35% text expansion (German).
- Mirror cleanly for Arabic right-to-left, including the direction of the animations.
- Handle CJK line heights.

**Breakpoints:** 390, 768, 1280 and 1440+.

## 10. Deliverables

1. The full homepage at **1440px desktop** and **390px mobile**, as a working prototype with the scroll animations and the interactive simulator running.
2. Every simulator state: idle, ringing, no answer, busy (skipped), connected, caller menu and voicemail/transcript.
3. A reduced-motion version of the call-story section.
4. A one-page **motion spec** giving the trigger, duration, easing and reduced-motion fallback for each section.
5. The photography **shot list** and the SVG illustration assets for the Circle.

**Definition of done:**
- A first-time visitor can explain what iCanCall does after the call-story section.
- Every section maps to one stage of the journey.
- Every animation shows something true about the product.
- **Get started** is never more than one scroll away.
