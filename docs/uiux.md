# ZeroPay — UI/UX Design Document

### Version 1.0 · Team Null Void · Cardano Hackathon Asia IBW 2025 → Production
### Document Owner: Madhavan Singh Parihar
### Depends On: PRD v1.0, TRD v1.0
### Status: Living Document — Updated as Design Evolves

---

## Table of Contents

1. [Design Philosophy & Principles](#1-design-philosophy--principles)
2. [Target User Mental Models](#2-target-user-mental-models)
3. [Design System Foundation](#3-design-system-foundation)
4. [Typography System](#4-typography-system)
5. [Color System](#5-color-system)
6. [Spacing & Layout Grid](#6-spacing--layout-grid)
7. [Iconography & Illustration](#7-iconography--illustration)
8. [Motion & Animation Principles](#8-motion--animation-principles)
9. [Component Library — Atoms](#9-component-library--atoms)
10. [Component Library — Molecules](#10-component-library--molecules)
11. [Component Library — Organisms](#11-component-library--organisms)
12. [Screen-by-Screen UX Specification](#12-screen-by-screen-ux-specification)
13. [User Flow Diagrams](#13-user-flow-diagrams)
14. [Chat Interface Deep Specification](#14-chat-interface-deep-specification)
15. [Payment Flow UX — Step-by-Step](#15-payment-flow-ux--step-by-step)
16. [Merchant Dashboard UX](#16-merchant-dashboard-ux)
17. [QR System UX](#17-qr-system-ux)
18. [Counter Checkout Mode UX](#18-counter-checkout-mode-ux)
19. [Error States & Empty States](#19-error-states--empty-states)
20. [Loading States & Skeleton UI](#20-loading-states--skeleton-ui)
21. [Notifications & Feedback UX](#21-notifications--feedback-ux)
22. [Onboarding UX — Complete Flow](#22-onboarding-ux--complete-flow)
23. [Mobile UX Adaptations](#23-mobile-ux-adaptations)
24. [Accessibility Specification](#24-accessibility-specification)
25. [Responsive Breakpoints](#25-responsive-breakpoints)
26. [Dark Mode Specification](#26-dark-mode-specification)
27. [Micro-interaction Catalogue](#27-micro-interaction-catalogue)
28. [UX Writing Guidelines](#28-ux-writing-guidelines)
29. [Design Handoff Specification](#29-design-handoff-specification)
30. [Design Debt & Future Considerations](#30-design-debt--future-considerations)

---

## 1. Design Philosophy & Principles

### The Central Design Tension

ZeroPay sits at the intersection of two worlds that have radically different design cultures. The crypto world defaults to complex dashboards, dark themes, hexagonal grids, laser-eyed visuals, and terminology that excludes anyone outside the community. The payment UPI world defaults to bright whites, friendly rounded corners, large tap targets, vernacular language, and instant visual feedback. 

ZeroPay belongs to neither. It belongs to the shop owner who has never heard of a UTXO and the young professional who has. The design must feel familiar to both — as natural as a WhatsApp conversation, as trustworthy as a bank receipt, as fast as scanning a PhonePe QR.

The design direction is **warm precision** — a phrase that captures two simultaneous requirements. Warmth: approachable, human, unhurried, clear. Precision: exact amounts, exact status, exact timing, exact records. Every design decision is evaluated against this phrase.

### The Five Design Principles

**Principle 1: Amounts are sacred.** Money creates anxiety. Every time an amount is displayed, it must be instantly legible, correctly formatted, and presented with its unit. INR amounts are always shown with the ₹ symbol and two decimal places. ADA amounts are always shown to two decimal places. Lovelace never appears anywhere in the UI. The hierarchy of amount display is always: INR primary (large, prominent), ADA secondary (smaller, supporting). This hierarchy never inverts.

**Principle 2: Status is never ambiguous.** At any moment in a payment flow, the user knows exactly one of four things: waiting for payment, payment processing, payment confirmed, or payment failed/expired. There is no fifth state. There is no "checking" or "loading" that obscures which of the four states applies. The UI uses color, icon, and text together — never just color alone — to communicate status.

**Principle 3: Actions are singular.** On any given screen, there is exactly one primary action. The user never faces a choice between two equally prominent buttons. Secondary actions exist but are visually subordinate. This is especially important in the payment flow where a mistaken tap could cause unintended behavior.

**Principle 4: Blockchain is a background process.** The words "blockchain," "on-chain," "UTXO," and "confirmation" do not appear in any user-facing text. What appears instead: "Payment processing" (confirming), "Payment confirmed" (settled), "Secure receipt" (IPFS). The blockchain is infrastructure, not a feature — it works in the background and the user benefits from it without needing to understand it.

**Principle 5: Trust is earned visually.** A payment app for real money must look like it belongs in that category. Sloppy alignment, inconsistent spacing, mixed font weights, and low-contrast text destroy trust before a single rupee changes hands. The visual quality of the interface is a direct signal of the quality of the underlying system.

### Design Anti-Patterns to Avoid

These are patterns that have been evaluated and explicitly rejected:

Crypto aesthetic — dark backgrounds by default, neon accents, hexagonal grids, ticker-tape price movements, laser effects, skull-and-rocket iconography. These signals exclude non-crypto users.

Startup generic — the purple-gradient-on-white aesthetic with SF Pro or Inter, rounded-rectangle cards that look like every fintech from 2019-2023. This communicates "another payments startup" rather than "trustworthy tool."

Feature maximalism — cramming all features into a single dashboard with 12 widgets. The primary screen for a merchant is the chat list and an amount. Nothing else matters until those are mastered.

Text walls — long descriptive labels, paragraphs of explainer text in the middle of flows. Every line of text in the UI costs the user attention. Earn that cost or cut the text.

---

## 2. Target User Mental Models

### Understanding How Meena Thinks About Payments

Meena (the street vendor) thinks about payments in terms of: did I get the money, how much did I get, and where is the record. She does not think about wallet addresses, UTXOs, blockchain confirmations, or exchange rates. When she opens PhonePe, she sees a number in her account and a list of recent transactions. She wants the same experience from ZeroPay.

Her mental model maps to these UI concepts: "Did I get the money?" → the payment status indicator (large, clear, green when yes). "How much?" → the INR amount display on the dashboard. "Where is the record?" → the receipt link in the settled chat message.

The UI must never ask Meena to form a new mental model. It must map its concepts onto the models she already has.

### Understanding How Arjun Thinks About Payments

Arjun (the crypto-native customer) thinks about payments in terms of: wallet connection, transaction approval, and tx hash. He wants to see the wallet selector he recognizes, the familiar wallet extension popup, and a tx hash he can verify independently. He will check the Cardano explorer if something seems wrong.

His mental model is more sophisticated, and the UI accommodates him through progressive disclosure — advanced details (tx hash, block height, IPFS CID) are available in expanded views, but they are not pushed on users who do not want them.

### The Mental Model Mismatch — The One Hard Problem

The hardest UX problem in ZeroPay is the exchange rate. Meena thinks in rupees. Arjun pays in ADA. The invoice is created in rupees and locks an ADA amount. The rate changes between when Meena creates the invoice and when Arjun approves it. This gap creates three moments of potential confusion:

Moment 1 — When Arjun sees the payment bubble: he sees ₹150 and 3.24 ADA. He wonders why the ADA amount is so specific.

Moment 2 — When Arjun's wallet shows the transaction: the wallet shows only the ADA amount. He may not see the rupee equivalent in the wallet's approval screen.

Moment 3 — When the rate has moved: if ADA/INR changed between invoice creation and payment, the ADA amount in the invoice and the current ADA equivalent of ₹150 are different numbers.

The design addresses each moment specifically. Moment 1: the bubble always shows both amounts together with explicit labels, never just one. Moment 2: a pre-approval summary screen in the app (before the wallet popup) shows both amounts one final time. Moment 3: if the rate has moved more than 2%, a non-alarming notice appears: "The ADA amount was locked when this request was created. It may differ from today's equivalent." This is informational, not a warning — the transaction is still valid.

---

## 3. Design System Foundation

### Design Token Architecture

All visual properties are defined as design tokens — named variables rather than hard-coded values. Tokens are organized in three tiers:

**Tier 1 — Global tokens:** The raw values. Color hex codes, font family names, pixel values. These are not used directly in component code. Example: `--global-green-500: #22C55E`, `--global-font-size-lg: 1.125rem`.

**Tier 2 — Semantic tokens:** Named by purpose, not by value. These reference global tokens. Example: `--color-success: var(--global-green-500)`, `--text-size-body: var(--global-font-size-lg)`. These are what component code uses.

**Tier 3 — Component tokens:** Specific to a component, referencing semantic tokens. Example: `--payment-card-background: var(--color-surface-elevated)`, `--payment-card-confirmed-border: var(--color-success)`. These allow component-level customization without breaking the broader system.

This three-tier structure means: changing the brand's primary green only requires updating one global token, and it cascades through all semantic and component tokens automatically.

### The Shape Language

ZeroPay uses a consistent shape vocabulary. Primary interactive elements (buttons, cards, inputs) use `border-radius: 16px` — rounded enough to feel friendly, not so round that it looks toy-like. Secondary containers (panels, list items) use `border-radius: 12px`. Small elements (badges, tags, chips) use `border-radius: 8px`. Full-circle elements (avatars, status dots, icon buttons) use `border-radius: 50%`. No element uses `border-radius: 0` (hard corners) unless it is an intentional full-bleed design element.

### Elevation System

Depth is communicated through subtle shadows rather than borders. Five elevation levels are defined:

Level 0 — flat (no shadow): backgrounds, dividers, inactive elements.

Level 1 — surface shadow (`box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`): cards at rest, list items.

Level 2 — raised shadow (`box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)`): hover state cards, bottom sheets at rest.

Level 3 — floating shadow (`box-shadow: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)`): modals, dropdown menus, tooltips.

Level 4 — overlay shadow (`box-shadow: 0 25px 50px rgba(0,0,0,0.15)`): full-screen overlays, the wallet selection sheet.

Shadows use only black with low opacity — no colored shadows, no glow effects. The shadow is the same in both light and dark modes; only the surface colors change.

---

## 4. Typography System

### Font Selection Rationale

The primary typeface is **DM Sans** — a geometric sans-serif designed for digital interfaces. DM Sans reads cleanly at small sizes, has excellent numeric legibility (critical for a payment app where users scan amounts quickly), and has a personality that is professional without being cold. It was explicitly chosen over Inter (too generic), Roboto (too Android-default), and Space Grotesk (overused in crypto products).

The display typeface, used for large numbers and headings, is **DM Mono** — the monospaced companion to DM Sans from the same type design family. Monospaced numerals eliminate the layout shift that happens with proportional numerals when amounts update (3.24 ADA doesn't jump layout when it changes to 3.25 ADA). The shared design DNA between DM Sans and DM Mono creates visual coherence between prose text and numeric display.

Both fonts are available on Google Fonts (free, no cost, loaded via CDN).

### Type Scale

The type scale uses a 1.25 (Major Third) ratio for harmonious size progression. All sizes are defined in `rem` units so they scale with the user's system font size preference (accessibility requirement).

`--text-xs: 0.75rem` (12px): captions, timestamps, metadata labels. Used sparingly — below 12px creates legibility problems.

`--text-sm: 0.875rem` (14px): secondary body text, list item descriptions, placeholder text.

`--text-base: 1rem` (16px): primary body text, message content, form inputs.

`--text-lg: 1.125rem` (18px): prominent labels, section headings within cards.

`--text-xl: 1.25rem` (20px): card titles, amount labels in secondary position.

`--text-2xl: 1.5rem` (24px): screen headings, primary amount display in invoices.

`--text-3xl: 1.875rem` (30px): dashboard total amounts, large status headings.

`--text-4xl: 2.25rem` (36px): counter checkout keypad digits, large confirmation amounts.

`--text-5xl: 3rem` (48px): the payment confirmation checkmark amount — the most important number on the screen.

### Font Weight Usage

DM Sans is used at three weights only: 400 (Regular) for body text and descriptions, 500 (Medium) for labels, secondary headings, and interactive text, and 700 (Bold) for primary amounts, primary headings, and confirmed status text. DM Mono is used at 400 (Regular) only — monospaced at bold weight becomes difficult to read.

### Line Height and Letter Spacing

Body text (DM Sans, base and smaller): `line-height: 1.5`. Heading text (DM Sans, xl and above): `line-height: 1.25`. DM Mono (all sizes): `line-height: 1.4`, `letter-spacing: -0.01em` (very slight tightening for amounts — monospace tends to feel loose). Labels and metadata: `line-height: 1.3`, `letter-spacing: 0.01em` (very slight widening for small uppercase labels).

### Numeric Display Rules

Amounts are always displayed using `font-variant-numeric: tabular-nums` to ensure all digits take equal width and columns of numbers align perfectly. This is applied as a global rule on any element displaying a monetary amount. Currency symbols (₹) are rendered in DM Sans at the same size as the number. ADA amounts are rendered in DM Mono. This visual distinction — DM Sans for rupees, DM Mono for ADA — creates an immediate visual grammar: DM Mono signals "blockchain amount."

---

## 5. Color System

### Primary Palette

The primary palette is built around a warm teal — a color that is neither the cold blue of traditional banking, nor the aggressive green of typical fintech "success" indicators, nor the neon colors of crypto. Warm teal reads as trustworthy and modern without the baggage of either design world.

`--color-primary-50: #EFFCFA` — lightest tint, used for very light backgrounds
`--color-primary-100: #D0F5F0` — light tint, used for hover states on light backgrounds
`--color-primary-200: #A1EBE1` — medium-light tint
`--color-primary-300: #5DD5C7` — medium tint, used for secondary UI elements
`--color-primary-400: #2DC4B2` — medium-dark tint
`--color-primary-500: #14A99A` — the primary brand color, main buttons, links, active states
`--color-primary-600: #0E8C80` — darker shade, used for button hover states
`--color-primary-700: #0B7167` — dark shade, used for pressed states
`--color-primary-800: #0A5A52` — very dark, used sparingly
`--color-primary-900: #093F3A` — darkest, used for high-contrast text on tinted backgrounds

### Semantic Status Colors

Four status colors, each with a 50-shade (light background) and a 600-shade (text/icon on white):

**Confirmed / Success:** Green family. `--color-success-light: #F0FDF4`, `--color-success: #16A34A`, `--color-success-dark: #15803D`. Used when a payment has settled. Not the default "call to action" green — reserved exclusively for confirmed payment states to preserve semantic meaning.

**Processing / Warning:** Amber family. `--color-warning-light: #FFFBEB`, `--color-warning: #D97706`, `--color-warning-dark: #B45309`. Used for pending and confirming states. Conveys "in progress" rather than "problem."

**Failed / Error:** Red family. `--color-error-light: #FEF2F2`, `--color-error: #DC2626`, `--color-error-dark: #B91C1C`. Used for expired invoices, failed transactions, and form validation errors.

**Informational:** The primary teal family. `--color-info-light: var(--color-primary-50)`, `--color-info: var(--color-primary-500)`. Used for neutral system messages and tips.

### Neutral Palette

The neutral palette uses warm-tinted grays (a hint of teal in the neutrals creates visual cohesion with the primary palette):

`--color-neutral-0: #FFFFFF` — pure white, page backgrounds
`--color-neutral-50: #F8FAFA` — very slight off-white, secondary page backgrounds
`--color-neutral-100: #F1F4F4` — card backgrounds, input backgrounds
`--color-neutral-200: #E4EAEA` — dividers, borders
`--color-neutral-300: #CBD4D4` — disabled element backgrounds
`--color-neutral-400: #94A3A3` — placeholder text, disabled icons
`--color-neutral-500: #6B7C7C` — secondary text, captions
`--color-neutral-600: #4A5858` — body text, descriptions
`--color-neutral-700: #2E3B3B` — primary text on light backgrounds
`--color-neutral-800: #1A2424` — headings, high-emphasis text
`--color-neutral-900: #0A1010` — maximum contrast text

### Color Usage Rules

A color is used for exactly one semantic purpose and that purpose is never violated. Primary teal means "interactive and active." Green means "confirmed payment." Amber means "in progress." Red means "error or expired." Violating these assignments (using red for anything non-error, for example) destroys the semantic system and forces users to read labels instead of scanning colors.

Backgrounds are never fully black (`#000000`) or fully white (`#FFFFFF`). The darkest background is `--color-neutral-900` and the lightest is `--color-neutral-0`. This creates enough contrast range without the harshness of pure black-and-white.

Color alone is never the sole indicator of status. Every status has an icon and a text label alongside the color. This is both an accessibility requirement (for colorblind users) and a usability principle (colors require learned association, icons provide instant meaning).

---

## 6. Spacing & Layout Grid

### Spacing Scale

All spacing values are multiples of a 4px base unit. Fibonacci-inspired progression to create natural-feeling size jumps:

`--space-1: 4px` — minimum spacing, used between tightly related elements (icon and label)
`--space-2: 8px` — compact internal padding, small gaps
`--space-3: 12px` — standard internal padding for small components
`--space-4: 16px` — standard gap, the most-used spacing value
`--space-5: 20px` — slightly generous gap
`--space-6: 24px` — section-level internal padding
`--space-8: 32px` — gap between major sections
`--space-10: 40px` — large section gaps, screen padding on desktop
`--space-12: 48px` — very large gaps, header height
`--space-16: 64px` — page-level sections
`--space-20: 80px` — hero-level spacing

### Layout Grid

The layout uses a 12-column grid on desktop (≥ 1024px), a 4-column grid on tablet (768px–1023px), and a single-column layout on mobile (< 768px). Column gutter is `--space-6` (24px) on desktop, `--space-4` (16px) on tablet and mobile. Page margins are `--space-10` (40px) on desktop, `--space-6` (24px) on tablet, `--space-4` (16px) on mobile.

The chat interface uses a fixed two-column layout on desktop: a fixed-width left panel (320px) for the chat room list and a flexible-width right panel for the active chat. On mobile, these become two separate screens with navigation between them.

The merchant dashboard uses a 3-column grid for the overview stats row (total today, order count, pending count) on desktop. This collapses to a 2-column grid on tablet and a 1-column stacked layout on mobile.

### Content Width Constraints

The maximum content width is 1280px, centered on the page. This prevents the layout from becoming too wide on large monitors. The chat interface has a maximum width of 960px for the two-column layout. Form screens (onboarding, settings, invoice creation) have a maximum width of 480px to maintain comfortable reading width for input fields.

---

## 7. Iconography & Illustration

### Icon System

Icons use the **Lucide** icon set (open source, MIT license, used via `lucide-react`). Lucide was chosen over Heroicons (less refined stroke weight), Feather (incomplete set), and Material Icons (Android-native feel). Lucide's stroke weight, corner radius, and optical sizing are consistent across the entire set.

Icons are used at two sizes only: 20px (inline with text, in buttons, in compact UI) and 24px (standalone in UI, in navigation, in status indicators). No other sizes are used. This consistency creates visual rhythm. Icons never scale to match adjacent text size — they are always 20px or 24px regardless of the text next to them.

Icon colors match their semantic context. Active navigation icons use `--color-primary-500`. Status icons use the appropriate status color (success, warning, error). Decorative icons and UI chrome use `--color-neutral-500`.

### Payment Status Icons

Four icons carry the entire weight of payment status communication. They must be universally understood without labels (though labels always accompany them):

**Pending:** An open clock circle (hourglass or clock outline). Color: `--color-neutral-400`. Represents "waiting."

**Processing:** An animated spinner (rotating circle arc). Color: `--color-warning`. Represents "actively working." This is the only animated icon — the motion draws the eye to the status update.

**Confirmed:** A filled circle with a checkmark inside. Color: `--color-success`. Represents "done." This icon replaces the spinner with a satisfying snap — the animation from spinner to checkmark is a key micro-interaction (see Section 27).

**Failed/Expired:** A filled circle with an X inside. Color: `--color-error`. Represents "did not complete."

### Illustration Principles

Illustrations are used sparingly — only in empty states and in the onboarding flow. No spot illustrations on functional screens. The illustration style is flat, geometric, and uses the primary color palette. Character illustrations (for empty state "no transactions yet" screens) are abstract and culturally neutral — no specific ethnicity or age implied. All illustrations are SVG for resolution independence.

---

## 8. Motion & Animation Principles

### When to Animate

Motion earns its keep by communicating state changes that text and color alone do not fully convey. The three moments that justify animation in ZeroPay:

**Confirmation moment:** When a payment moves from "processing" to "confirmed," the spinner morphs into a checkmark. This is the most emotionally significant moment in the product — the merchant has been paid, the customer's payment is done. A static icon swap is insufficient. The animation is 600 milliseconds, ease-out, and uses a scale + opacity sequence.

**Status progression:** As an invoice moves through states, the status bubble in the chat updates. The transition is a cross-fade of the content within the bubble — the old content fades out, the new content fades in over 200 milliseconds. The bubble's background color transitions smoothly using CSS `transition: background-color 300ms ease`.

**Screen transitions:** Navigation between screens uses a directional slide — forward navigation slides in from the right, back navigation slides out to the right. The animation is 250 milliseconds, using a custom cubic-bezier that accelerates quickly and decelerates gently for a natural feel.

**Amount entry:** In the counter checkout keypad, each digit the merchant taps causes the amount display to briefly scale up (to 1.03) and back down over 100 milliseconds. This micro-animation confirms the input was received without being distracting.

### When Not to Animate

Loading states use skeleton screens, not animations, for content areas. Animations on loading states create false urgency and can feel slower than static alternatives. Hover states on desktop use CSS transitions (150 milliseconds, ease) on background color and shadow only — no transform animations on hover (these feel heavyweight for interactive controls). Error messages appear immediately without animation — the user's attention is needed on the error, not on the entrance of the error.

### Performance Budget for Animation

All animations use CSS `transform` and `opacity` exclusively. These two properties are compositor-accelerated and do not trigger layout or paint. No animations modify `width`, `height`, `top`, `left`, `margin`, or `padding`. The JavaScript animation library (if needed beyond CSS) is `@motionone/dom` for HTML or `framer-motion` for React — both are tree-shakeable and add minimal bundle weight.

---

## 9. Component Library — Atoms

### Button

Three variants: Primary, Secondary, Ghost. One destructive variant. Two sizes: Default (44px height) and Small (36px height).

**Primary button:** `background: var(--color-primary-500)`, `color: white`, `border-radius: 12px`, `padding: 0 20px`, `font-size: var(--text-base)`, `font-weight: 500`. Hover: background darkens to `var(--color-primary-600)` over 150ms. Active: scale(0.98) and background `var(--color-primary-700)`. Loading state: spinner icon replaces leading icon, button text remains, button disabled.

**Secondary button:** `background: var(--color-primary-100)`, `color: var(--color-primary-700)`, same shape as primary. No border — the tinted background distinguishes it.

**Ghost button:** `background: transparent`, `color: var(--color-neutral-700)`, same shape. On hover: `background: var(--color-neutral-100)`.

**Destructive button:** Same shape as primary. `background: var(--color-error)`. Used only for irreversible actions like "Cancel Invoice."

**Button states:** Every button has explicit styles for default, hover, active (pressed), focused (keyboard), disabled, and loading. No state is left unstyled.

### Input Field

Single design for all text inputs. `background: var(--color-neutral-100)`, `border: 2px solid transparent`, `border-radius: 12px`, `padding: 12px 16px`, `font-size: var(--text-base)`. On focus: border changes to `var(--color-primary-500)`, no box-shadow (box-shadow creates visual noise in forms). Error state: border changes to `var(--color-error)`, an error message appears below the field in `--color-error`, `--text-sm`.

**Amount input:** A specialized input for entering INR amounts. Displays the ₹ symbol as a non-editable prefix inside the field. The input's value is the raw number (no formatting while typing). On blur, the value formats to two decimal places. Uses `inputmode="decimal"` on mobile to trigger the numeric keyboard. Maximum length validation prevents absurdly large values.

### Badge

Small inline status indicator. `border-radius: 6px`, `padding: 2px 8px`, `font-size: var(--text-xs)`, `font-weight: 500`. Four color variants matching the status system: neutral (gray), success (green), warning (amber), error (red). Each uses the light background color (50-shade) with the dark text color (700-shade) for the text — never white text on a status color. This keeps badges legible and avoids the visual aggression of colored background with white text on small elements.

### Avatar

Circular image or initial-based fallback. Two sizes: 32px (compact, used in chat lists) and 40px (standard, used in chat headers and settings). The initial-based fallback uses the first letter of the user's display name, rendered in white on a background color derived deterministically from the user's ID (hash function → index into a palette of 12 distinct colors). This means the same user always gets the same color across sessions and devices.

### Status Dot

A 10px circle used to indicate online presence. Green (`--color-success`) for online (last seen within 5 minutes). Gray (`--color-neutral-300`) for offline. Positioned as an overlay on the bottom-right corner of an avatar. Includes a white 2px border to visually separate it from the avatar background.

### Divider

A 1px horizontal line in `--color-neutral-200`. Used to separate sections within a card or between list items. Never used as decoration — only used where content genuinely needs separation.

---

## 10. Component Library — Molecules

### List Item (Chat Room)

The fundamental unit of the chat room list. 72px height. Structure: avatar (40px) on the left, name and last message in the center, timestamp and unread badge on the right. The name is rendered in `--text-base`, `font-weight: 500`. The last message preview is rendered in `--text-sm`, `--color-neutral-500`, truncated to one line with an ellipsis. The timestamp is rendered in `--text-xs`, `--color-neutral-400`. The unread badge is shown only when there are unread messages — a circular badge (20px diameter) in `--color-primary-500` with white text showing the count.

The entire list item is a single tap target. The tap area extends to the full width of the screen on mobile (no visible gap to the screen edge). On hover (desktop), the background transitions to `--color-neutral-50`.

### Invoice Card (Payment Request Bubble)

The most important molecule in the entire product — the interactive payment request that appears in chat. It is a card, not a bubble, because it contains structured information that needs visual organization.

Structure from top to bottom: A thin header row showing "Payment Request" label (left) and the expiry timer (right). The INR amount in large DM Sans Bold at `--text-3xl`. The ADA equivalent in DM Mono Regular at `--text-sm` with the exchange rate in `--text-xs` and `--color-neutral-500`. An optional description line in `--text-sm`. An optional line-items section that expands on tap. A divider. The primary action area — which changes based on status.

**Pending state:** Full-width primary button labeled "Pay Now." The button is `--color-primary-500`. The card's left border is a 3px strip in `--color-warning`.

**Processing state:** A spinner + "Processing payment..." text where the button was. The card's left border changes to `--color-warning`. The tx hash appears below the spinner in DM Mono, `--text-xs`, truncated to 8 characters + ellipsis + last 8 characters, tappable to open the Cardano explorer.

**Confirmed state:** A checkmark icon + "Payment confirmed" text in `--color-success`. The card's left border changes to `--color-success`. A "View receipt" link appears below.

**Expired state:** An X icon + "Expired" text in `--color-error`. The card's left border changes to `--color-error`. A disabled "Expired" button replaces the action area.

The card has `elevation-1` shadow and `border-radius: 16px`. It is always rendered at a maximum width of 320px, regardless of the chat window width.

### Price Display Row

A specialized molecule for showing the ADA/INR conversion. Renders on the payment confirmation screen before the user taps their wallet. Layout: "₹150.00" on the left in `--text-2xl` bold, an arrow icon in the center in `--color-neutral-400`, "3.24 ADA" on the right in DM Mono `--text-2xl`. Below this row: "Rate: ₹46.29 per ADA · as of 10:00 AM" in `--text-xs`, `--color-neutral-500`. If the rate is stale, this row's color changes to `--color-warning` with a small clock icon.

### Stat Card

Used in the merchant dashboard overview. Four per row on desktop, two per row on mobile. Each card shows: a label in `--text-sm` on top, a large number below in `--text-3xl` bold, and an optional trend indicator (small arrow + percentage change vs. yesterday). The stat card uses `elevation-1`, `border-radius: 16px`, and `padding: --space-6`.

### Toast Notification

Used for brief informational feedback. Appears at the bottom of the screen (mobile) or top-right (desktop). `border-radius: 12px`, `padding: 12px 16px`, `elevation-3`. Four variants matching the status colors. Auto-dismisses after 3 seconds with a slide-out animation. The user can tap to dismiss early. Toasts stack — subsequent toasts appear above previous ones with a stagger animation.

---

## 11. Component Library — Organisms

### Chat Room List Panel

The left panel on desktop (fixed 320px wide), the first screen on mobile. Contains: a sticky header with the user's name and avatar, a search input (for finding a merchant by name), and a scrollable list of chat room items ordered by most recent activity.

Empty state: when the user has no chats, a centered illustration with the text "No conversations yet" and a secondary button "Scan a merchant QR to start." This is the primary onboarding prompt for new customers.

### Chat Window

The right panel on desktop, the second screen on mobile (navigated to from the chat list). Contains: a sticky chat header (merchant avatar, name, online status, and a menu button), the scrollable message list, and a sticky input bar at the bottom.

The message list auto-scrolls to the bottom when a new message arrives (if the user was already at the bottom). If the user has scrolled up to read history, a "New message" floating button appears that scrolls back to the bottom when tapped.

The input bar contains: a text input (grows up to 5 lines before scrolling), a ₹ button (opens invoice creation sheet), and a send button (arrow icon, `--color-primary-500`, active only when input has content).

### Invoice Creation Sheet

A bottom sheet (mobile) or centered modal (desktop) triggered by the ₹ button in the chat input bar. Contains: a numeric keypad for INR amount entry with a large display of the entered amount, a "Description" text field, an "Add items" expandable section, an ADA equivalent preview (updates live as the amount is typed), and a "Send Request" primary button.

The sheet's height is 85vh on mobile to allow the user to see part of the chat behind it (visual context that they are creating a request for this specific conversation).

### Merchant Dashboard Organism

The complete dashboard view. Organized into four visual sections:

Overview bar at the top: three stat cards (today's total, order count, pending invoices) and a "Counter Checkout" button on the right side.

Revenue chart: a 7-day bar chart below the overview. Each bar is labeled with the day abbreviation (Mon, Tue, etc.) and the INR total for that day. Today's bar is highlighted in `--color-primary-500`; past days are `--color-neutral-300`. The chart is rendered with no third-party charting library — it is a pure SVG generated from the data, keeping the bundle minimal.

Transaction table: a full-width table below the chart. Columns: date/time, description, amount (INR), amount (ADA), status badge, and an expand chevron. Each row is expandable to show the technical details (tx hash, block height, IPFS CID link). The table uses `font-variant-numeric: tabular-nums` so all number columns align perfectly.

Pending invoices panel: shown only when there are pending invoices, as a collapsible section below the transaction table. Lists pending invoices with their amounts, descriptions, and expiry timers. Each has a "Cancel" ghost button.

### Wallet Connect Sheet

A bottom sheet presented when the user needs to connect a Cardano wallet. Shows: a list of detected wallet extensions with their logos and names, an "Install a wallet" section if no wallets are detected (with links to Eternl and Lace), and a "Learn more" link. Selecting a wallet triggers the CIP-30 approval flow. While waiting for the user to approve in the wallet extension, the button shows a spinner. On success, the sheet dismisses with a slide-down animation and a success toast appears.

---

## 12. Screen-by-Screen UX Specification

### Screen 01 — Splash / Auth Entry

**Purpose:** First screen the user sees. Must immediately communicate the product's identity and offer two paths: sign in or get started.

**Layout:** Full-bleed background in `--color-primary-50` (very light teal). Centered vertically and horizontally. Top: the ZeroPay logo mark (a stylized teal checkmark inside a chat bubble, reflecting the core metaphor). Below: the product name "ZeroPay" in DM Sans Bold `--text-3xl`. A single line tagline: "Pay like you chat." in `--text-lg`, `--color-neutral-500`.

**Actions:** Two buttons centered below the tagline with `--space-3` gap between them. Primary: "Get started" (creates new account). Ghost: "Sign in" (existing account). No other UI on this screen.

**Design decision:** No feature list, no benefit bullets, no "powered by Cardano" badge on the splash. The product earns trust through use, not through marketing copy on the entry screen.

---

### Screen 02 — Sign In / Sign Up

**Purpose:** Authentication. Two tabs: Phone (OTP) and Email.

**Layout:** White background. Top: back arrow. Below: "Welcome to ZeroPay" in `--text-2xl` bold. Two tabs below the heading (not full-width segment controls — narrow tabs flush-left). Active tab has a 2px bottom border in `--color-primary-500`.

**Phone tab:** A phone number input with a country code selector (pre-selected to +91 for India). "Continue" primary button. On tap: input is validated, if valid the button shows a loading spinner and the OTP is sent. Screen transitions to the OTP entry screen.

**Email tab:** Email field and password field. "Continue" primary button. Below the button: a "Forgot password?" ghost link.

**OTP Screen (follows Phone tab):** Shows the last 4 digits of the phone number ("We sent a code to +91 ••••••1234"). Six individual input boxes for the OTP digits (not a single field — individual boxes feel deliberate and precise). Auto-advances to the next box on each digit entry. Auto-submits when the sixth digit is entered. A "Resend code" link appears after 30 seconds with a countdown timer.

---

### Screen 03 — Customer Home (Chat List)

**Purpose:** Default home screen for users who are not yet merchants, or for merchant users who open the app as a customer. Shows their chat history with merchants.

**Layout:** Top bar: "ZeroPay" text logo (left), avatar/profile icon (right). Below: a search input for finding chats. Below: the chat list.

**Empty state (first time):** A centered illustration of a chat bubble with a teal payment card inside. Heading: "No payments yet." Sub-text: "Scan a merchant's QR code to start." A full-width primary button: "Scan QR Code."

**Populated state:** Chat list items (see Section 10). A floating action button (FAB) in the bottom right: a QR scan icon in `--color-primary-500`. The FAB is 56px diameter.

---

### Screen 04 — Merchant Home (Dashboard + Chat List)

**Purpose:** The home screen for merchant users. Shows both their dashboard overview and their incoming payment chats.

**Layout:** Top navigation tabs: "Dashboard" and "Messages" as two equal-width tabs with the active tab indicated by the `--color-primary-500` underline. The "Dashboard" tab shows the Merchant Dashboard Organism. The "Messages" tab shows the same chat list as Screen 03 but with the merchant-perspective context (incoming requests from customers).

**Design decision:** Merchants need to see money and messages — both are important. The tab design gives each equal status rather than burying one under the other.

---

### Screen 05 — Chat Room

**Purpose:** The core interaction screen. Where payments happen.

**Layout:** Full-height screen. Sticky header: back arrow, merchant/customer avatar + name, online status dot, three-dot menu (options: "View merchant profile," "Report," "Clear chat"). Message list (scrollable, fills available height). Sticky input bar at the bottom (above the keyboard when keyboard is visible).

**Message rendering:** Messages are right-aligned (from the current user) or left-aligned (from the other party) following universal chat conventions. Text bubbles use `border-radius: 18px` with one corner set to 4px (the corner closest to the avatar) — this "tail" effect communicates directionality without an actual tail graphic. Payment request cards are always left-aligned (they come from the merchant) even if the merchant sends them from their own app view. Timestamps appear on long-press of any message.

**Keyboard behavior:** When the keyboard opens, the input bar lifts with it (via `position: sticky; bottom: 0`). The message list reflows upward. The scroll position is maintained on the most recent message. On iOS, `env(safe-area-inset-bottom)` is used to ensure the input bar clears the home indicator.

---

### Screen 06 — Wallet Connection

**Purpose:** Allow the user to connect their Cardano wallet extension. Shown as a modal/sheet on top of the previous screen.

**Layout (bottom sheet):** Header: "Connect your wallet" in `--text-xl` bold. Sub-text: "Your keys never leave your device." Below: a list of detected wallets, each as a list item with the wallet's logo, name, and a "Connect" ghost button. Below the wallet list: a divider, then "Don't see your wallet? Install one:" with icon links to Eternl and Lace download pages.

**After connection:** A brief success state: a checkmark animation, "Connected to [Wallet Name]," the user's address (first 8 chars + ... + last 8 chars) in DM Mono. "Done" primary button. Sheet dismisses.

---

### Screen 07 — Invoice Creation (Merchant Side)

**Purpose:** Merchant creates a payment request to send in chat.

**Layout (bottom sheet, 85% viewport height):** Header: "Request payment" with a close (X) button. Amount display area: shows "₹0" in `--text-4xl` bold, updating as digits are entered on the keypad. Below the amount: shows the ADA equivalent in real time (e.g., "≈ 3.24 ADA") in DM Mono `--text-base`, `--color-neutral-500`. The keypad (3×4 grid, including backspace and decimal) fills the lower portion of the sheet. Above the keypad: a "Description" text field with placeholder "e.g. 2 masala chai." At the very bottom: "Send Request" primary button, disabled until amount is greater than the minimum.

**Validation:** If the entered amount converts to less than 1 ADA, the ADA line shows a warning: "Minimum is [X] ADA" and the Send button remains disabled.

---

### Screen 08 — Payment Approval (Customer Side)

**Purpose:** Customer reviews the payment details and approves via their wallet.

**Layout (screen, not sheet — this is a major action):** Top: "Confirm payment" heading. Large card showing the Price Display Row molecule (₹150 → 3.24 ADA). Below: merchant name and shop name. Below: description and items if present. Below: "Exchange rate locked at time of request" in `--text-xs`, `--color-neutral-500`. Primary button: "Pay with [Wallet Name]." Ghost button below: "Cancel."

**After tapping "Pay with...":** A loading state with "Opening your wallet..." appears for up to 2 seconds. The wallet extension opens its approval dialog. If the user approves: transition to Screen 09 (processing). If the user cancels in wallet: return to this screen with a toast "Payment cancelled."

---

### Screen 09 — Payment Processing

**Purpose:** Shows the customer their payment is in progress. Not a blocking spinner — the user can navigate away.

**Layout:** An inline status area within the chat replaces the "Pay Now" button in the payment request card. Shows: spinning indicator, "Processing," the tx hash (truncated, tappable). A "View in explorer" ghost link. The user can navigate away — the status will update via Firebase push when confirmed.

---

### Screen 10 — Payment Confirmed

**Purpose:** The happy ending. The money has moved.

**Layout:** The payment request card in chat updates. The spinner is replaced by a filled green circle with a checkmark. "Payment confirmed" in `--color-success`, `font-weight: 700`. The amount is shown again. "View receipt" link appears below. A push notification also arrives at the merchant's device simultaneously.

**The Checkmark Animation:** The confirmation moment uses a two-step animation. Step 1: the spinner decelerates and fades out over 200ms. Step 2: a green circle scales from 0 to 1 over 300ms (cubic-bezier ease-out), and then a checkmark path is drawn inside the circle over 400ms (CSS stroke animation). Total duration: ~900ms. This animation plays only once — it does not loop.

---

### Screen 11 — Settings

**Purpose:** Account configuration for both roles.

**Layout:** Scrollable list of settings groups. Each group has a gray section header. Settings items are list rows with a label, optional value on the right, and a chevron for navigable items.

**Groups:** Profile (display name, phone, email). Wallet (connected address shown truncated, "Change wallet" option). As Merchant (only shown if user has merchant role): shop name, payment address, invoice expiry, receipt settings. Notifications (payment received, payment confirmed, invoice expired — toggles). About (version, terms, privacy policy, open source licenses).

---

## 13. User Flow Diagrams

### Flow 01 — New Merchant Complete Onboarding

Entry point → Splash → Tap "Get started" → Sign up screen → Enter phone → OTP entry → OTP verified → Customer home (chat list, empty) → Banner: "Accept ADA payments? Set up your store →" → Tap banner → Merchant setup: enter shop name and category → Tap "Continue" → Wallet connection sheet → Select Eternl (or other) → Wallet approval → Wallet connected confirmation → QR code screen → "Your QR is ready" → Download QR → Land on Merchant home (Dashboard tab, empty state).

Total screens: 12. Total taps: approximately 14. Target time: under 8 minutes for a non-technical user.

### Flow 02 — Customer Scans QR and Pays

Entry point → Open app → Customer home → Tap FAB (scan QR) → Camera opens → Point at merchant QR → QR decoded → App navigates to chat room (existing or new) → Chat room screen → If existing: last message visible. If new: empty state with "Start chatting" prompt → Merchant sends payment request (happens on merchant's device, appears in chat via Firebase push) → Customer sees payment request card → Tap "Pay Now" → Payment approval screen → Tap "Pay with Eternl" → Wallet approval dialog → Customer approves → Processing state in chat → Firebase push updates status → Confirmed state in chat → Receipt appears in chat.

### Flow 03 — Merchant Counter Checkout

Entry point → Merchant home → Tap "Counter Checkout" button → Counter checkout screen (full-screen) → Type amount on keypad → Tap description to add optional text → Tap "Generate Bill" → QR code appears full-screen on device → Customer scans with their Cardano wallet → Customer's wallet sends ADA to contract address → Merchant's screen shows "Waiting for payment" with a pulsing border → Blockchain confirms (typically 60-90 seconds) → Merchant's screen flashes green full-bleed confirmation animation → Amount displayed large → "New Transaction" button → Returns to keypad.

### Flow 04 — Invoice Expiry Recovery

Merchant sends payment request → Customer does not pay within 10 minutes → Invoice expires → Payment request card in chat updates to "Expired" state (red border, X icon, disabled button) → Both parties receive push notification → Merchant can create new invoice from the chat or from dashboard.

---

## 14. Chat Interface Deep Specification

### Message Grouping

Consecutive messages from the same sender within a 5-minute window are grouped visually. Grouped messages share a single avatar display (avatar shows next to the first message only, subsequent messages in the group have no avatar, just indentation). The timestamp shows only on the last message of a group. This reduces visual clutter in active conversations.

### System Messages

System messages are distinct from user messages — they represent automated state updates, not user communication. System messages appear centered in the chat with no avatar, in `--text-xs`, `--color-neutral-400`, and a horizontal rule on each side of the text. Examples: "Invoice expired · 10:05 AM." "Payment request created · 10:00 AM." These are not interactive.

### Message Timestamp Behavior

Timestamps are not shown permanently next to every message (this creates extreme visual clutter). Timestamps appear in two situations: as a date separator (e.g., "Today," "Yesterday," "May 17") at the beginning of each day's message group, and as a brief tooltip that appears when the user long-presses (mobile) or hovers for 1 second (desktop) a specific message. The tooltip shows the full timestamp in "10:05 AM" format.

### Chat Input Bar Behavior

The text input auto-resizes vertically as the user types, up to a maximum of 5 lines (approximately 100px). Above 5 lines, the content scrolls within the input while the input stays fixed height. The send button is gray and disabled when the input is empty. It turns `--color-primary-500` and becomes enabled when any content is present. The ₹ button remains always enabled (creating an invoice does not require any text in the input).

### Scroll Behavior and New Message Detection

The chat scroll position is managed by a scroll anchor — the message list stays pinned to the bottom as new messages arrive, unless the user has explicitly scrolled up. Scroll-up detection happens when the user's scroll position is more than 200px from the bottom. In that state, a floating "↓ New message" button appears at the bottom of the chat window. Tapping it scrolls smoothly to the bottom and dismisses the button.

The "New message" button shows the sender's name and a preview of the message: "Meena: ₹150 payment request." It dismisses automatically after 3 seconds if the user scrolls to the bottom naturally.

---

## 15. Payment Flow UX — Step-by-Step

### Every Second of the Customer Payment Experience

This section documents the precise UX at each moment in the payment flow from the customer's perspective. Each step should be no more than 2 seconds of user interaction time.

**Second 0–5:** Customer sees the payment request card in chat. The card shows the amount clearly. They tap "Pay Now." The button enters loading state immediately (prevents double-tap, provides feedback).

**Second 5–7:** The Payment Approval screen loads. The customer sees the price display: ₹150 = 3.24 ADA. Merchant name. Description. The "Pay with [wallet]" button is visible and prominent. No additional information is required from the customer at this point.

**Second 7–10:** Customer taps "Pay with Eternl." A brief loading indicator appears on the button. The Eternl extension popup opens. The popup shows: recipient address (truncated), amount (3.24 ADA), network fee (~0.17 ADA), total (3.41 ADA).

**Second 10–15:** Customer reviews and taps "Confirm" in Eternl. Eternl submits the transaction to the Cardano network. The tx hash is returned to the ZeroPay app.

**Second 15–16:** The ZeroPay app receives the tx hash. The payment approval screen transitions back to the chat room. The payment card status changes from "Pay Now" to "Processing" with the spinner.

**Second 16–90:** The customer waits. The chat is functional — they can send text messages. The payment card status is visible in the conversation. A toast at the top: "Payment submitted. You'll be notified when it confirms."

**Second 60–90 (variable, Cardano block time):** A push notification arrives: "Payment confirmed." The chat auto-scrolls to the payment card. The card transitions from spinner to checkmark animation. The receipt link appears. The entire experience is complete.

### What the Merchant Sees Simultaneously

When the customer taps "Pay Now," the payment request card in the merchant's chat updates from "Pending" to a subtle state change (the expiry timer disappears, a small indicator shows "Customer is paying"). When the transaction is submitted, the card updates to show the processing state with the tx hash. When confirmed, the merchant's card shows the checkmark and they receive a push notification simultaneously with the customer.

---

## 16. Merchant Dashboard UX

### Dashboard Information Hierarchy

The dashboard answers three questions in order of importance: "How much did I make?" (today's total, largest and most prominent), "How many transactions?" (secondary, smaller), and "Is anything pending?" (tertiary, shown as a count and a list).

Today's total is displayed in `--text-5xl` on the overview stat card — the largest text on any screen in the application. This number is the merchant's single most important daily data point. Everything else on the dashboard is subordinate to it.

### Real-Time Dashboard Updates

When the merchant has the dashboard open and a payment is confirmed, the dashboard updates without a page refresh. The sequence: the job queue writes the new status to Firebase. The frontend's Firebase listener (on the invoice status path) fires. The TanStack Query cache for the dashboard stats is invalidated programmatically. The stats refetch in the background. The new total appears with a brief number transition animation (the old number counts up to the new number over 400ms) — this draws the merchant's eye to the change without being jarring.

### Transaction Table Behavior

The transaction table has two display modes: collapsed (the default, showing one row per invoice) and expanded (showing technical details). The expanded state is toggled by clicking anywhere on the row — no separate "expand" button. The chevron icon on the right of each row indicates the collapsed/expanded state, rotating 90° when expanded.

Expanded state reveals: full invoice ID, tx hash (in DM Mono, tappable), block height, confirmation count at settlement, IPFS CID (tappable, opens receipt in new tab), and the exact ADA/INR rate used for this invoice.

The table supports filtering by status (all, pending, settled, expired, failed) using a chip group above the table. Only chips with relevant statuses are shown — if there are no failed invoices, the "Failed" chip is not shown. The "All" chip is always shown and always selected by default.

---

## 17. QR System UX

### Static Merchant QR — Visual Design

The downloadable merchant QR is not just a QR code — it is a complete payment card suitable for printing. The card measures 85mm × 55mm (standard business card size) for the default format and A6 (105mm × 148mm) for the counter display format.

The card design: white background. The ZeroPay logo in the top-left corner. The shop name in `--text-lg` bold, centered. Below the shop name: the QR code itself (the largest element on the card). Below the QR: the merchant ID in `--text-sm`, `--color-neutral-500` (e.g., "MC-0042"). A thin teal bar at the bottom of the card with "Scan to pay with ADA" in white `--text-xs`.

The QR code error correction level is set to M (15% error correction capacity). This allows the QR to be printed at smaller sizes without scanning issues, and maintains scannability even if the printed card has minor physical damage.

### QR Scanner UI

The in-app QR scanner uses the device camera in a full-screen view. A centered 240×240px square overlay (white corners only, not a full border) defines the scanning zone. The rest of the screen is dimmed (50% black overlay). A thin horizontal line animates top-to-bottom within the scanning zone (representing a scanning beam). Text below the overlay: "Point at a ZeroPay merchant QR."

On a successful scan, the scanner plays a haptic feedback (on mobile) and a brief success animation (the corner markers briefly flash green). The scanner closes and navigation occurs immediately.

On scanning a non-ZeroPay QR (any QR that does not decode to the `zeropay://` URI scheme), a bottom toast appears: "This QR code is not from ZeroPay." The scanner remains open.

---

## 18. Counter Checkout Mode UX

### Full-Screen Keypad Design

Counter checkout mode takes over the full screen — all navigation chrome disappears. This is intentional: the merchant at their counter does not need the rest of the app during a transaction. The mode is entered via a prominent button on the dashboard and exited via a "×" button or by pressing the device back button.

The screen is divided into two zones. The upper zone (40% of screen height): the amount display. Shows "₹0.00" updating as digits are entered, in `--text-5xl`, `font-weight: 700`, horizontally centered. Below the amount: the ADA equivalent in DM Mono `--text-lg`, updating live. A very subtle "Tap to add description" link below the ADA amount.

The lower zone (60% of screen height): the numeric keypad. 3 columns × 4 rows. Keys: 1–9, decimal point, 0, backspace. Each key is 100% width of its column, 68px height, with `--space-2` gap between keys. The key background is `--color-neutral-100`. On press: `--color-neutral-200` background with scale(0.97) transition over 80ms.

A "Generate Bill" primary button sits below the keypad, full width, 52px height. Disabled and showing "Enter an amount" label until a valid amount is entered. Becomes enabled and shows "Generate Bill" once a valid amount (≥ minimum) is entered.

### QR Display and Confirmation

After tapping "Generate Bill," the screen transitions to a QR display screen. The transition is a quick fade (150ms) rather than a slide, because the merchant needs to point the screen at the customer immediately — a slide animation would delay this by an awkward 250ms.

The QR display screen: a large QR code (filling the center 70% of the screen width, centered). Below: "Scan with your Cardano wallet" in `--text-base`, `--color-neutral-500`. A countdown timer below that (e.g., "Expires in 9:43"). The screen background is white for maximum QR scanning contrast.

On the left side of the screen (visible on wider phones and tablets): the amount (₹150.00) and description in a vertical sidebar. On narrow phones: this information is in a compact row above the QR code.

### Confirmation Animation

When a payment confirms, the QR display screen is replaced by a full-screen confirmation view. The transition: the QR code fades out, the entire background sweeps to `--color-success` from bottom to top over 400ms. On the green background: a large white checkmark (80px, drawn with a stroke animation over 600ms). Below: the amount in white `--text-4xl` bold ("₹150.00 received"). Below: "From: [Customer name or 'Anonymous']" if the customer is a ZeroPay registered user.

This full-bleed green screen is visible from across a shop counter — the merchant can see it from a distance without needing to read the screen. The checkmark is universally understood.

After 5 seconds (or immediately on tap), the "New Transaction" button appears, which resets back to the keypad.

---

## 19. Error States & Empty States

### Error State Design Principles

Error states must do three things: acknowledge what happened, explain why in plain language, and provide a specific next step. A page that just shows "Something went wrong" with a refresh button has failed the user.

### Specific Error States

**Invoice expired while customer was on approval screen:** The approval screen shows an amber banner at the top: "This request has expired. Ask [merchant name] to send a new one." The "Pay" button is replaced with a disabled "Expired" button. The customer is not stranded — they know exactly what to do next.

**Wallet connection rejected by user:** A brief toast at the bottom: "Wallet connection cancelled." The wallet connection sheet returns to its initial state. No penalty for cancelling — the user can try again by tapping "Connect wallet" again.

**Wallet extension not installed:** The wallet selection list shows zero wallets (detected via MeshJS). An informational card appears: "No Cardano wallet found on this browser." A list of recommended wallets with "Install" links: Eternl (recommended), Lace, Nami. A note: "After installing, refresh this page and try again."

**Payment submission failed (user cancelled in wallet):** The payment approval screen returns with the "Pay with [wallet]" button re-enabled. A toast: "Payment cancelled. You can try again." The invoice is still active if within the expiry window.

**Transaction failed on-chain:** The payment card in chat transitions to an error state. A system message appears: "Payment could not be confirmed. Your ADA was not deducted." A "Try again" ghost button appears on the expired card — this opens a new invoice creation sheet pre-filled with the same amount and description.

**API server unreachable (Render cold start):** The app shows a full-screen loading state with a friendly message: "Waking up... just a moment." A progress indicator. This state automatically resolves when the server responds. If it takes more than 30 seconds, the message changes to: "Taking longer than usual. Check your connection." with a "Try again" button.

### Empty States

**Empty chat list (new customer):** Illustration of a QR code with a small sparkle. Heading: "No conversations yet." Sub-text: "Scan a merchant's QR to start." Primary button: "Scan QR."

**Empty transaction history (new merchant):** Illustration of a receipt with a teal stamp. Heading: "No transactions yet." Sub-text: "Share your QR code and start accepting ADA." Primary button: "View my QR code."

**No matching search results (transaction search):** Small illustration of a magnifying glass. "No transactions found." Sub-text matches the search context: "Try a different date range or search term."

---

## 20. Loading States & Skeleton UI

### Skeleton Screen Philosophy

Skeleton screens are preferred over spinners for content loads that display multiple items. A skeleton communicates the shape of the incoming content, reducing perceived load time because the user's eye has already oriented to the layout. Spinners provide no layout information and feel slower for content-heavy loads.

### Dashboard Skeleton

When the dashboard data is loading, the skeleton shows: three gray rectangles where the stat cards will be (88px height each), a wider gray rectangle where the chart will be (200px height), and a table with 5 rows of gray rectangles matching the column structure of the transaction table. All skeleton elements use `--color-neutral-100` as the background with a subtle shimmer animation (a gradient that sweeps from left to right over 1.5 seconds, infinitely). The shimmer communicates "loading" without being distracting.

### Chat Message Skeleton

On initial chat load, the chat window shows a skeleton of 5-7 message bubbles, alternating between left-aligned (merchant) and right-aligned (customer) positions, with varying widths to simulate real message lengths. This disappears when the first 50 messages load from Firebase.

### Single Content Loads

For actions that load a single piece of content (expanding a transaction row, loading a receipt URL), a spinner is used — small (20px), inline, in `--color-primary-500`. This appears within the content area rather than taking over the screen.

---

## 21. Notifications & Feedback UX

### Push Notification Design

Push notification content is written to be actionable without opening the app. The merchant's payment confirmation notification reads: "₹150 received · Meena's Chai Corner." The customer's confirmation reads: "Payment confirmed · ₹150 to Meena's Chai Corner. View receipt →." The arrow at the end signals that tapping the notification takes the user somewhere specific.

Notification grouping: on both iOS and Android, multiple ZeroPay notifications from the same day are grouped under the app name rather than appearing as separate notifications. The group summary shows the count: "3 new payments."

### In-App Feedback

Three levels of in-app feedback are used, applied appropriately by the weight of the action:

**Toast (bottom, 3s auto-dismiss):** For informational confirmations that do not require acknowledgment. "Invoice cancelled." "Wallet connected." "Copy to clipboard successful."

**Banner (inline, persistent until dismissed):** For persistent states that affect the current screen. "No network connection — showing cached data." "Wallet disconnected — reconnect to make payments."

**Modal confirmation (blocking, requires explicit action):** For destructive or irreversible actions. "Cancel this invoice? The customer will be notified and will need a new request." with "Cancel Invoice" (red) and "Keep" (ghost) buttons.

---

## 22. Onboarding UX — Complete Flow

### Design Philosophy for Onboarding

Onboarding asks the user to give something (time, information, wallet access) before they have received value from the product. Every step must feel like it is moving toward something concrete. The cardinal rule: never ask for something the product does not immediately use. If the product does not need the user's date of birth, do not ask for it "for profile completeness."

### Step-by-Step Onboarding for Merchants

**Step 1 — Account creation (Screen 02):** No design changes from the standard auth screen. The merchant is creating a regular account, not a merchant account yet. No merchant-specific language appears here.

**Step 2 — Role declaration:** After first sign-in, a one-time screen appears: "How will you use ZeroPay?" with two large tappable cards: "I'm a customer — pay with ADA" and "I'm a merchant — accept ADA payments." Customers skip merchant onboarding entirely. Merchants continue. Users who want both roles select "I'm a merchant" — they can always pay as a customer too.

**Step 3 — Shop details:** A simple form with two fields: Shop name (text input, required, max 50 characters) and Category (a horizontal scrollable chip selector: Food, Retail, Services, Vendor, Other — each with a small icon). A progress indicator shows "Step 1 of 3."

**Step 4 — Wallet connection:** The wallet connection sheet (Section 12, Screen 06) appears. Progress: "Step 2 of 3." This step explains why the wallet is needed in one sentence above the wallet list: "Connect your Cardano wallet to receive payments." No other explanation needed.

**Step 5 — QR code:** The merchant sees their QR code for the first time. Progress: "Step 3 of 3." The screen is celebratory in tone: "You're ready to accept ADA!" The QR code is large and central. A "Download QR" primary button (saves to device). A "Share QR" ghost button (native share sheet). A "Go to my dashboard" ghost button below.

### Preventing Onboarding Abandonment

If a merchant exits the app mid-onboarding (closes the browser or switches apps), the onboarding resumes at the last completed step when they return. Step completion is saved to the User document in MongoDB after each step. On next login, the app detects the incomplete onboarding and returns to the next incomplete step rather than the home screen.

If a merchant completes the account but does not connect a wallet (stops after Step 3), they land on the dashboard with a persistent banner: "Connect your wallet to start accepting payments →." This banner persists until the wallet is connected and cannot be dismissed without completing the action.

---

## 23. Mobile UX Adaptations

### Touch Target Standards

Every interactive element has a minimum tap target of 44×44 pixels, per Apple's Human Interface Guidelines and WCAG 2.1 standards. Elements that are visually smaller than 44px (such as the timestamp link in a chat message) are given invisible padding to expand their hit area to the minimum. The tap area never overlaps with an adjacent element's tap area.

### Thumb-Friendly Layout

On mobile, the most frequently used actions are reachable with the thumb without shifting the phone's grip. The primary action area is in the lower 60% of the screen on most screens. The navigation (tab bar, chat input) is at the bottom. Secondary actions and navigation (back buttons, screen titles) are at the top — less frequently accessed and worth the stretch.

The counter checkout keypad is specifically designed for one-handed use. All keys are within natural thumb reach on a standard-sized phone. The "Generate Bill" button is at the very bottom of the screen — a deliberate natural landing position after finishing number entry.

### Gesture Handling

Horizontal swipe-right to go back is supported on all screens (consistent with iOS default behavior and implemented for Android parity). No other custom gestures are introduced — gestures that are not standard create discovery and muscle memory problems.

Long-press on a chat message shows a context menu: Copy (for text messages), View Details (for payment cards). No swipe-to-delete on messages (messages are permanent records).

### Safe Area Insets

All screens respect iOS safe area insets: top (notch/dynamic island) and bottom (home indicator). The bottom input bar in chat uses `padding-bottom: calc(16px + env(safe-area-inset-bottom))` to ensure it clears the home indicator. The tab bar (on mobile) uses the same pattern.

---

## 24. Accessibility Specification

### WCAG 2.1 Level AA Compliance

The target is WCAG 2.1 Level AA compliance throughout the application. Level AAA is aspirational for specific high-value interactions (the payment confirmation flow). The following criteria are explicitly addressed:

**1.4.3 Contrast (Minimum):** All text meets a 4.5:1 contrast ratio against its background. All UI components and graphical objects meet a 3:1 contrast ratio. The neutral color palette was designed with this requirement — `--color-neutral-500` on `--color-neutral-0` achieves exactly 4.64:1.

**1.4.11 Non-text Contrast:** The status indicator colors (success green, warning amber, error red) all meet 3:1 contrast against both white and the light tinted backgrounds they appear on. All interactive element boundaries (button borders, input focus rings) meet 3:1 contrast.

**2.1.1 Keyboard:** Every interactive element is reachable and operable via keyboard. Tab order follows the visual reading order. Custom interactive elements (the QR scan button, the payment card "Pay Now" button) have explicit `tabIndex` values and keyboard event handlers.

**2.4.3 Focus Order:** Focus moves through the page in a logical order. Focus never gets trapped in a component (except intentionally in a modal, where focus loops within the modal). When a modal or sheet opens, focus moves to the first focusable element inside it.

**2.4.7 Focus Visible:** All focusable elements have a visible focus indicator. The focus ring style: `outline: 2px solid var(--color-primary-500); outline-offset: 2px`. This is applied globally using `:focus-visible` (not `:focus`) to avoid showing the focus ring on mouse click while still showing it for keyboard navigation.

**3.3.1 Error Identification:** Every form error is identified in text (not just color) and describes the specific error condition. "This field is required" is not acceptable. "Enter an amount in rupees (e.g., ₹150)" is acceptable.

### Screen Reader Compatibility

All status changes that happen asynchronously (the payment card updating from "processing" to "confirmed") are announced to screen readers using ARIA live regions. The payment status area uses `aria-live="polite"` and `aria-atomic="true"`. This ensures a screen reader user hears "Payment confirmed" when the status updates, even though they may not be focused on the payment card at the time.

All icons used without accompanying visible text have `aria-label` attributes. Icons used alongside visible text have `aria-hidden="true"` (the text is the accessible label, not the icon). The avatar images have `alt` text set to the user's display name.

---

## 25. Responsive Breakpoints

### Breakpoint Definitions

`--breakpoint-mobile: 0px–767px` — Single column layout, bottom navigation, full-screen modals, stacked card groups.

`--breakpoint-tablet: 768px–1023px` — Two-column layout in some contexts (chat list + chat window), side navigation optional, modals are centered overlays.

`--breakpoint-desktop: 1024px–1279px` — Full two-column chat layout, top navigation, modals are centered overlays, dashboard uses 3-column stat grid.

`--breakpoint-wide: 1280px+` — Content width capped at 1280px, centered, additional whitespace on sides. No new layout changes beyond the desktop breakpoint.

### Component-Specific Responsive Behavior

**Chat interface:** On mobile: chat list and chat window are separate screens with forward/back navigation. On tablet+: side-by-side panels. The left panel has a minimum width of 280px and a maximum of 320px. The right panel fills the remaining space.

**Dashboard stats row:** Mobile: 1 column (stacked). Tablet: 2 columns. Desktop: 3 columns.

**Invoice creation sheet:** Mobile: bottom sheet at 85% viewport height. Desktop: centered modal at fixed 480px width and auto height.

**Counter checkout:** Mobile and tablet: full-screen, optimized for finger touch. Desktop: centered 480px wide panel with the same keypad — counter checkout on desktop is less common but should work.

**QR confirmation display:** Mobile: QR code fills 80% of viewport width. Tablet+: QR code is capped at 360px to avoid being too large to scan from close range.

---

## 26. Dark Mode Specification

### Dark Mode Strategy

Dark mode is supported but is not the default. The default is light mode (appropriate for the target users — street vendors and merchants in bright outdoor environments). Dark mode activates when the user's OS is set to dark mode (via `prefers-color-scheme: dark` media query) or via a manual toggle in settings.

Dark mode is not simply inverted light mode. Each semantic token has an explicit dark mode value that was chosen for that context specifically.

### Dark Mode Token Values

`--color-neutral-0` (page background) in dark mode: `#0F1717` (very dark teal-tinged background, not pure black — pure black creates harsh contrast with UI elements and looks unprofessional in payment contexts).

`--color-neutral-100` (card background) in dark mode: `#1A2424`.

`--color-neutral-200` (dividers) in dark mode: `#263030`.

`--color-neutral-700` (primary text) in dark mode: `#E8EEEE` (warm off-white, not pure white).

`--color-primary-500` (primary teal) in dark mode: unchanged (`#14A99A`) — the primary brand color is consistent across modes.

Status colors in dark mode: the light backgrounds (50-shade) are replaced with very dark equivalents. `--color-success-light` in dark mode: `#052E16`. `--color-warning-light` in dark mode: `#1A1200`. `--color-error-light` in dark mode: `#1A0404`.

### Dark Mode Typography

In dark mode, font weight is slightly reduced for body text — `font-weight: 400` text in light mode becomes `font-weight: 400` but with a very small reduction in `letter-spacing` (0.01em) to compensate for the higher apparent weight of light text on dark backgrounds (light text on dark backgrounds appears bolder than the same weight dark text on light backgrounds, a well-documented optical phenomenon).

---

## 27. Micro-interaction Catalogue

### The Checkmark Transition (Highest Priority)

Trigger: Invoice status changes from `confirming` to `confirmed`.

The payment card's status area contains a processing spinner (a circular arc rotating continuously at 0.8 rotations per second). When the confirmed status arrives via Firebase:

Frame 0–200ms: The spinner decelerates using a cubic-bezier(0.4, 0, 1, 1) curve, slowing from full speed to a stop. Its opacity fades to 0.

Frame 200–500ms: A filled circle (40px diameter) scales from 0 to 1 at the same position as the spinner was, in `--color-success`. Uses cubic-bezier(0.175, 0.885, 0.32, 1.275) (slightly overshoots, creating a "pop" feel).

Frame 500–900ms: A checkmark path is drawn inside the circle using a CSS stroke-dashoffset animation. The path starts from the left point of the checkmark and draws to the right.

Frame 900ms+: The card's left border color transitions from `--color-warning` to `--color-success` over 300ms.

Total: approximately 1.2 seconds from status update to fully settled visual state.

### Keypad Key Press

Trigger: User taps a key on the counter checkout keypad.

The key immediately shifts to a slightly darker background color (`--color-neutral-200` from `--color-neutral-100`) and scales to 0.96 over 80ms. It returns to 1.0 over 120ms. Total: 200ms. Haptic feedback fires at tap moment (medium impact on iOS, weak vibration on Android, via the Vibration API on web/PWA).

The amount display above the keypad scales briefly to 1.03 over 100ms then back to 1.0 over 150ms. This creates a "counting" feel.

### Button Press States

All primary buttons: on press, scale to 0.98 and background darkens one shade over 80ms. On release, return to 1.0 over 150ms. This gives every tap a tactile feel without being overly dramatic.

### Chat Message Send

When the user taps the send button, the input bar clears immediately (not after the message appears in the chat — immediate clearing prevents the user from seeing a lag). The message appears in the chat list with an "optimistic" render (gray, slightly transparent) that becomes fully opaque when Firebase confirms receipt. This entire sequence is imperceptible at normal network speeds — the optimistic render and the confirmed render happen within milliseconds.

### Invoice Expiry Countdown Timer

The timer on the payment request card counts down from the expiry duration (default 10 minutes) in MM:SS format. For the last 60 seconds: the timer text color transitions from `--color-neutral-500` to `--color-warning`. For the last 10 seconds: the text pulses (opacity oscillates between 1.0 and 0.6, 0.5s period). At 0:00: the card transitions to the expired state with a brief shake animation (translateX oscillating ±4px, 3 cycles, 400ms total). The shake communicates "this is now invalid" without an alarming color flash.

---

## 28. UX Writing Guidelines

### Voice and Tone

ZeroPay's voice is direct, warm, and non-technical. It speaks to the user the way a knowledgeable friend explains things — not the way a bank's legal team writes disclosures.

Three tone dimensions and where each applies:

**Direct and confident:** In payment status updates and confirmations. "Payment confirmed." Not "Your payment appears to have been successfully confirmed." The user needs certainty, not hedged language.

**Warm and helpful:** In onboarding, empty states, and error explanations. "Scan a merchant's QR to get started" is warmer than "No conversations found. Navigate to a merchant profile to initiate a payment."

**Matter-of-fact:** In amounts, labels, and technical details. "₹150.00" not "approximately one hundred fifty rupees." "Tx: abc123...xyz789" not "Your unique transaction identifier."

### Word List — Use and Avoid

Use "wallet" not "crypto wallet" (users understand "wallet"). Use "Payment confirmed" not "Transaction successfully validated." Use "Receipt" not "IPFS immutable receipt document." Use "Processing" not "Awaiting blockchain confirmation." Use "Connect your wallet" not "Link your Cardano address." Use "Your shop" not "merchant profile." Use "Amount" not "lovelace value."

Avoid: "blockchain," "on-chain," "UTxO," "lovelace" (in user-facing text), "confirmation," "validator," "smart contract," "datum," "gas fee" (wrong chain, but also avoid the concept), "cryptographic," "decentralized," "trustless" (as adjectives in UI text).

### Amount Formatting Rules

Indian number formatting for INR amounts: ₹1,50,000.00 (Indian comma placement — lakh, crore system — not Western millions). ADA amounts: 3.24 ADA (always two decimal places). Never show more than two decimal places for either currency in the UI — additional precision creates anxiety without adding information.

The ₹ symbol precedes the number with no space: ₹150.00 not ₹ 150.00. "ADA" follows the number with a space: 3.24 ADA not 3.24ADA.

---

## 29. Design Handoff Specification

### Design File Organization

Design files (Figma or equivalent) are organized as follows: a single file per major section (Chat, Dashboard, Onboarding, Components). Within each file: a "Design Tokens" page that defines all colors, typography, and spacing. A "Components" page showing all atoms and molecules in all their states. Screen pages showing each screen at mobile (390px) and desktop (1440px) widths.

### Naming Conventions for Handoff

Component names in design files match the component names in code exactly. A button component named "Button/Primary/Default" in Figma corresponds to `<Button variant="primary" />` in code. State names match CSS pseudo-classes where applicable: "Default," "Hover," "Active," "Focused," "Disabled," "Loading." This eliminates naming translation between design and engineering.

### Spacing Annotation

In design files, all spacing is annotated using the spacing scale variable names (space-4, space-6, etc.) rather than pixel values. This keeps the handoff tied to the design system rather than specific pixel measurements that would break at different viewport sizes.

### Redline Specifications for Complex Components

The Invoice Card (payment request bubble) requires explicit redline specifications due to its state complexity. Each of the five states (pending, processing, confirmed, expired, failed) is shown separately with all spacing, colors, and typography values explicitly labeled. The transitions between states are specified in the animation section with exact timing curves.

---

## 30. Design Debt & Future Considerations

### DD-001: No design for 3rd-party wallet external approval screen

**Description:** When the user approves a payment in their Eternl or Lace wallet extension, they see the wallet's own UI — not ZeroPay's. This screen is outside the design system's control. The transition from ZeroPay's polished UI to a third-party wallet's very different visual style creates a jarring context switch.

**Impact:** Minor friction, particularly for less tech-savvy users who may not recognize the wallet popup as the expected next step.

**Future consideration:** Provide better preparation before the wallet opens — a brief instructional overlay: "Your wallet will open. Confirm the details and tap Approve." This sets expectation for the context switch.

---

### DD-002: Counter checkout is web-only, not mobile-native

**Description:** Counter checkout mode is designed for the web app. On mobile browsers, the QR code display and keypad work but the full-screen experience is harder to achieve reliably across all mobile browsers.

**Impact:** Merchants using the web app on their phone for counter checkout have a suboptimal experience.

**Future consideration:** Build counter checkout as a dedicated screen in the React Native mobile app with native full-screen behavior for Version 2.0.

---

### DD-003: No multi-language support in UI

**Description:** The entire UI is in English. The target market (India, specifically Indore and similar tier-2 cities) has significant Hindi-speaking populations who may find English UI less accessible.

**Impact:** Limits merchant adoption in non-English-comfortable populations.

**Future consideration:** Hindi localization for the most-used merchant-facing screens (counter checkout, invoice creation, dashboard total). Use `react-i18next` for the translation layer. Copy must be written by a native Hindi speaker familiar with financial terminology — machine translation is not acceptable for monetary amounts.

---

### DD-004: No design for very large amounts

**Description:** The INR amount display in `--text-5xl` has not been tested for amounts above ₹10,000. A ₹1,50,000 amount at that font size will overflow on mobile screens.

**Impact:** Potentially broken layout for large transactions.

**Future consideration:** Add overflow handling for the amount display — auto-scale font size down if the amount string exceeds a certain character length. Test specifically with ₹99,99,999.00 (the likely maximum for a micro-payment product but an important edge case).

---

### DD-005: Confirmation animation accessibility

**Description:** The checkmark confirmation animation uses motion. Users who have set `prefers-reduced-motion: reduce` in their OS accessibility settings should not see this animation.

**Impact:** Potential accessibility issue for users with vestibular disorders who are affected by animation.

**Resolution (immediate):** Wrap all animations in `@media (prefers-reduced-motion: reduce)` overrides that replace animated transitions with immediate state changes. The checkmark still appears, but without the scale and draw animations. This is a quick code fix that should be implemented in the first development sprint.

---

*ZeroPay — UI/UX Design Document*
*Team Null Void · Cardano Hackathon Asia IBW 2025 → Production*
*All design decisions serve the merchant at their counter and the customer in their chat.*
*This document is the authoritative design reference for all visual and interaction decisions.*