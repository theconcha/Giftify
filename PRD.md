# Giftify — Product Requirements Document

**Version:** 2.1 (MVP)
**Author:** Michelle Kurzynski
**Date:** June 2026
**Status:** Approved — pending development

---

## 1. Overview

### Problem Statement

Gift-givers with go-to product lists (books, kitchen tools, beauty items, etc.) have no reliable way to track what they've already given to specific people. This results in duplicate gifts, last-minute holiday scrambles, and missed opportunities to give something meaningful.

### Solution

Giftify is a mobile-first web application that lets a Giver maintain a personal product library, record gift history per person and occasion, and receive AI-powered suggestions for upcoming gift-giving events.

---

## 2. Users & Roles

| Role | Description |
|---|---|
| **Giver** | The authenticated human user. Manages people, products, gifts, holidays, and occasions. |
| **AI** | The system's Gemini-powered agent. Reads person profiles, recommends products, auto-populates product fields from URLs, and suggests gifts for occasions. |

MVP is single-user per account. Multi-user and sharing are future scope.

---

## 3. Tech Stack

| Layer | Tool | Free Tier |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Free (open source) |
| Styling | Tailwind CSS | Free (open source) |
| Backend / Database | Supabase (Postgres) | 500MB DB, 2 projects |
| Authentication | Supabase Auth | Magic link (primary) + email/password (secondary) |
| File Storage | Supabase Storage | 1GB |
| Hosting | Vercel | 100GB bandwidth/month |
| AI | Google Gemini 2.0 Flash (Google AI Studio) | 1,500 requests/day free, no credit card required |
| Email (notifications) | Resend | 3,000 emails/month, 100/day |

All tools operate on free tiers. No recurring cost.

**Notes:**
- Magic link is the primary login method (default screen). Email + password is available as a secondary option.
- The Gemini API key is app-level — stored securely in a Supabase Edge Function, never exposed client-side. The 1,500 req/day quota is shared across all users.
- A Google account is required to generate a Gemini API key at aistudio.google.com
- On Gemini's free tier, API inputs/outputs may be used by Google to improve their models
- Occasion reminder emails are triggered by a Supabase scheduled Edge Function running on a daily cron — emails fire even when no user is logged in

---

## 4. Core Objects & Data Model

### 4.1 PERSON

A person the Giver gives gifts to.

| Attribute | Type | Notes |
|---|---|---|
| First + Last Name | String | Required |
| Birthday | Month + Day | Optional; auto-creates a recurring Birthday occasion when saved |
| Birthday Year | Year | Optional; enables age-appropriate AI suggestions and milestone birthday alerts (e.g., "Ashley is turning 40 this year") |
| Street Address | String | Optional |
| Email Address | String | Optional |
| Photo | Image | Optional; stored in Supabase Storage |
| Gender | Single select | Male, Female, Non-binary, Other |
| Pronouns | Single select | He/him, She/her, He/they, She/they, They/them, Other |
| Religion | Single select | Christian, Jewish, Islam, Hinduism, Buddhism, Confucianism, Taoism, Shinto, Atheist, Agnostic, Jainism, Sikhism, Other |

**Relationships:**
- A Person has been given 0–many Gifts
- A Person appears on 0–many Occasions

**AI actions:** Read profile; recommend products to give this person.
**Giver actions:** Create/Read/Update/Delete/Archive a person; give a person a gift.

---

### 4.2 PRODUCT

An item in the Giver's personal product library, appropriate for gift giving.

| Attribute | Type | Notes |
|---|---|---|
| Product Name | String | Required; auto-populated by AI from URL |
| Link / URL | URL | Source link; triggers AI auto-fill on add |
| SKU | String | Optional external identifier |
| Photo | Image | Auto-populated by AI from URL; can also be manually uploaded by the Giver |
| Unique Product Description | Text | Giver's personal note on why they love it |
| Price | Currency | Auto-populated by AI; can be edited |
| Product Category | Multi-select | See Section 10 for taxonomy |

**AI auto-population:** When a user pastes a URL, Gemini 2.0 Flash parses the page and fills in Product Name, Photo, and Price automatically. User can edit any field afterward. If Gemini cannot parse the URL (e.g., the page blocks bots, the link is broken, or the API is rate-limited), an inline error is shown ("We couldn't read that page — please fill in the details manually") and the user is dropped into the manual entry form with any successfully populated fields pre-filled.

**Relationships:**
- A Product can be included in 0–many Gifts
- A Product is appropriate for 0–many Holidays
- A Product has 0–many related Products (manually linked by the Giver on the product detail page; links are bidirectional)

**AI actions:** Ingest product from URL; update product; recommend product for person/occasion.
**Giver actions:** Favorite a product; add a product to a gift; archive a product; manually link related products; tag product with appropriate holidays.

---

### 4.3 GIFT

A single product (or a single free-text item) given to one or more people, typically for an occasion. Each gift contains exactly one product from the library or one free-text description — multiple gifts can be given to the same person for the same occasion, but each is recorded separately.

| Attribute | Type | Notes |
|---|---|---|
| Gift Name | String | e.g., "4,000 Weeks for Ashley" |
| Product | Link to Product | Optional; exactly 1 product from the library, OR 1 free-text description (e.g., "$50 cash", "Amazon gift card") |
| Date Given | Date | Required; defaults to today; editable to support retroactive logging |
| Message / Note | Text | Personal note attached to this gift |
| Custom Image | Image | Optional override photo |

**Relationships:**
- A Gift goes to 1–many Persons (recipients)
- A Gift is associated with 0–1 Holiday
- A Gift is associated with exactly 1 Occasion
- A Gift may have 0–many related Gifts (by shared person/holiday/occasion)

**AI actions:** Suggest a gift for a person for an occasion.
**Giver actions:** Give a gift (record a completed gift); edit a gift; delete a gift (with confirmation prompt).

---

### 4.4 HOLIDAY

A reusable template for a type of occasion. Most are pre-loaded by the system; users can create custom ones.

| Attribute | Type | Notes |
|---|---|---|
| Holiday Name | String | e.g., "Christmas", "Birthday", "Mother's Day" |
| Icon / Photo | Image | Visual identifier |
| Month, Day | Date (no year) | Recurring anchor date; may be a placeholder for holidays with shifting dates |

**System holidays** are pre-loaded and cannot be edited or deleted. They are visually distinguished from user-created holidays (e.g., a "System" badge) in Settings → Holiday Management.

**User-created holidays** are fully editable and deletable. A warning is shown before deleting a user-created holiday that has existing occasions referencing it.

**Relationships:**
- A Holiday spawns 1–many Occasions
- A Holiday has 0–many appropriate Products
- A Holiday has 0–many Gifts given for it

**Giver actions:** CRUD a holiday (for holidays not already in the system).

---

### 4.5 OCCASION

A specific instance of a holiday on a specific date, or a one-off reason for giving a gift.

| Attribute | Type | Notes |
|---|---|---|
| Occasion Name | String | e.g., "Ashley's Birthday 2026", "Christmas 2026" |
| Date | Date | Specific year + month + day |
| Explanatory Text | Text | For one-off occasions only; describes the reason |

**Relationships:**
- An Occasion has a parent Holiday (0–1)
- An Occasion has 0–many recipient Persons
- An Occasion has 0–many Gifts
- Occasions sharing the same Holiday are logically related (e.g., all birthday instances)

**Giver actions:** CRUD a one-off occasion.

---

## 5. Key Features (MVP)

### F1 — People Management
- Add, edit, view, and archive people
- Archived people are hidden from the main People list and AI suggestions; all gift history is preserved
- "Show archived" toggle on the People list reveals archived people
- Person detail view: full gift history sorted by date; toggle between products the person has received and products they have not yet received from the Giver's library
- List and card views of all people, switchable via a toggle button (grid icon / list icon) in the top-right of the screen; preference saved per tab
  - **Card view:** photo, name, gift count, key profile info
  - **Table row view:** dense text-based rows for quick scanning, no large photo
- Searchable by name
- Paginated: 20 people per page with classic numbered pagination

### F2 — Product Library
- Add a product by pasting a URL — AI auto-fills name, photo, and price
- If AI cannot parse the URL, an inline error is shown and the user continues with manual entry
- Manual add option for items without a URL
- Product card shows: photo, name, price, category, personal description, gift history count ("Given to 6 people")
- Product detail view includes a **"Who has received this?"** section showing all people who have received the product as a gift, with dates and a "Give again" option per person; a toggle reveals people who have not yet received it (paginated and searchable to handle scale)
- Favorite toggle per product
- Filter and sort by category, price, favorites, persons who received it as a gift, and persons who did not receive it as a gift
- Manually link related products on the product detail page; links are bidirectional and removable from either product
- Archive a product: hidden from library and AI suggestions, but gift history preserved; "Show archived" toggle reveals archived products
- List and card views switchable via toggle (same pattern as People); preference saved per tab
- Paginated: 20 products per page with classic numbered pagination

### F3 — Gift Recording
- Launched from: a product detail page, an occasion detail page, the Gifts tab, or a general "Record a gift" button
- Each gift contains exactly one product from the library or one free-text item; multiple gifts can be recorded for the same person and occasion separately
- Recorded via a multi-step modal:
  1. **Choose recipient(s)** — select one or more people from your People list
  2. **Choose product** — select one product from your library (with a "Not yet given to [recipient]" filter toggle for convenience), or enter a single free-text description (e.g., "$50 cash", "Amazon gift card")
  3. **Link occasion** — select an existing occasion or create a new one
  4. **Date given** — defaults to today; editable for retroactive logging
  5. **Add note** — optional personal message or note
- Gifts can be edited or deleted after recording; deletion requires a confirmation prompt ("Delete this gift? This can't be undone.")
- Gift history displayed on both Person and Occasion detail views

### F4 — Holidays & Occasions
- System pre-loads the following 15 holidays. System holidays cannot be edited or deleted; they are visually distinguished from user-created holidays in Settings.

| Holiday | Anchor Date |
|---|---|
| Birthday | Per-person (auto-created when a Person's birthday field is saved) |
| Christmas | December 25 |
| Valentine's Day | February 14 |
| Mother's Day | May 11 (2nd Sunday placeholder) |
| Father's Day | June 15 (3rd Sunday placeholder) |
| Hanukkah | December 25 (placeholder — shifts yearly; user adjusts the occasion date per year) |
| Diwali | October 20 (placeholder — shifts yearly; user adjusts the occasion date per year) |
| Thanksgiving | November 27 (4th Thursday placeholder) |
| Easter | April 1 (placeholder — shifts yearly; user adjusts the occasion date per year) |
| Passover | April 1 (placeholder — shifts yearly; user adjusts the occasion date per year) |
| Eid al-Fitr | No fixed date — user sets date per year |
| New Year's | January 1 |
| Wedding / Anniversary | No fixed date — user sets date |
| Baby Shower / New Baby | No fixed date — user sets date |
| Graduation | No fixed date — user sets date |

- Birthday occasions auto-generate for the next upcoming birthday only; when a birthday occasion passes, the following year's is automatically created (rolling)
- User can add custom holidays or one-off occasions
- Dashboard shows upcoming occasions in the next 90 days with a days-until indicator
- Occasion detail: list of recipients, planned/given gifts, AI suggestions
- Occasions list page includes a "Manage Holidays" shortcut link to Settings → Holiday Management
- Occasion detail page shows the parent holiday as a tappable link navigating to Settings → Holiday Management

### F5 — AI Gift Suggestions
- Surfaced as an always-visible suggestions strip embedded in Person and Occasion detail views:
  - **Mobile:** A persistent horizontal scrollable strip of gift idea cards pinned just above the bottom tab bar; always visible as the page content scrolls above it
  - **Desktop:** A collapsible right sidebar panel (expanded by default); toggled with a chevron button on the sidebar edge; state saved per session
- Each suggestion card shows: photo, name, price, and a brief AI-generated note (e.g., "You haven't given Ashley this yet")
- Tapping "Record as gift" on a suggestion card launches the gift recording modal pre-filled with that product and person/occasion
- AI considers: person's profile (gender, pronouns, religion as optional context), occasion type, and gift history
- Religion filter: available as an optional toggle, not applied automatically

### F6 — Dashboard / Home
- Upcoming occasions (next 90 days) sorted by date ascending (soonest first), with days-until indicator; "View all occasions" link opens the full Occasions tab
- Recent gift activity feed
- Quick-access to People and Products
- First-time users see a friendly empty state with CTAs ("Add the people you love to give to", "Add a product to your library") — no wizard, no sample data

### F7 — Gifts List
- Accessible via the Gifts tab in the bottom nav
- Chronological list of all recorded gifts, sorted by date descending (most recent first)
- Filterable by: recipient, product, occasion, and date range
- Each row shows: gift name, recipient(s), product or free-text description, occasion, and date given
- Tapping a gift opens its detail/edit view

### F8 — Notifications & Reminders
- In-app notification: shown in app header via bell icon
- Email reminder: sent via Resend at user-configured intervals before an occasion
- Reminder timing configurable in Settings: users select one or more lead times simultaneously (checkboxes: 30 days, 14 days, 7 days, 3 days, 1 day); all selected intervals are active simultaneously; applies globally to all occasions
- Reminders are triggered by a Supabase Edge Function running on a daily scheduled cron — fires automatically regardless of whether the user is logged in

### F9 — Settings
- **Notification timing:** Configure one or more reminder lead times (checkboxes: 30 days, 14 days, 7 days, 3 days, 1 day before an occasion); all selected intervals are active simultaneously
- **Account / profile:** Change display name, email address, profile photo; sign out
- **Holiday management:** View all holidays (system and user-created); add and manage custom holidays; delete user-created holidays (with warning if occasions reference them); system holidays are displayed with a "System" badge and cannot be edited or deleted
- **Danger zone:** Permanently delete account and all associated data

---

## 6. Authentication

### Login / Sign-up Screen
- Single screen with email field and "Send magic link" as the primary CTA
- "Use password instead" text link below the button
- Magic link handles both sign-in and sign-up: if no account exists, Supabase creates one automatically; if one exists, it signs in
- After magic link is sent: a "Check your email" confirmation screen displays the address entered, with "Resend" and "Back" options

### Password Flow (secondary)
- Clicking "Use password instead" swaps the screen to email + password fields
- "Sign in" primary button; "Forgot password?" and "Create account" links below

---

## 7. Navigation & App Shell

### Mobile (primary)
- **Bottom tab bar** (persistent on all screens), 5 tabs:
  - **G** (Home / Dashboard) — displayed as the stylized G icon (giftify-icon.svg); no label
  - People
  - Occasions
  - Gifts
  - Products
- **Header:** App name ("Giftify" in Plus Jakarta Sans, text-based placeholder for MVP) on the left; avatar/gear icon on the right linking to Settings
- **Back navigation:** All detail views show a back chevron ("←") in the top-left of the header labeled with the parent screen name (e.g., "← Occasions"); bottom tab bar remains visible throughout

### Tablet (768px+) and Desktop (1024px+)
- Bottom tab bar transitions to a left sidebar or top navigation
- Grid layouts expand: single-column → 2-column → 3-column
- Person and Occasion detail views use a two-column layout: main content on the left (~65%), AI suggestions sidebar on the right (~35%); sidebar is collapsible/expandable via a chevron toggle, expanded by default

---

## 8. Design Principles

- **Mobile-first:** Core flows designed for 375px width first; expanded for 768px (tablet) and 1024px+ (desktop)
- **Responsive:** Single-column → 2-column → 3-column grid progression; fluid layouts
- **Warm and personal:** Feels like a thoughtful personal organizer, not an enterprise tool
- **Fast to use:** Adding a person, recording a gift, and checking history each completable in under 30 seconds
- **Images never cropped:** Product photos (and all images in the app) must always be displayed in full — never cropped or cut off. Card views use a square image area with a white background and padding; the image is scaled to fit entirely within that area (object-contain). The detail page also shows the full image. Empty space around non-square images is filled with a white or cream background.
- **Flexible forms:** Select fields (gender, pronouns, religion, categories, etc.) support two interaction methods — users can either scroll and click a predefined option, or start typing to filter the list and then select from the narrowed results. Typing alone does not store a value; a selection from the predefined list is always required. This pattern applies consistently across all select/dropdown fields in the app.

### Color Palette

| Role | Color | Hex |
|---|---|---|
| Primary | Terracotta | #C2714F |
| Accent | Sage green | #7A9E7E |
| Background | Warm cream | #FAF6F1 |
| Text | Dark brown | #2D2420 |

### Typography

| Role | Font | Notes |
|---|---|---|
| All text | Plus Jakarta Sans | Primary; Nunito as fallback |
| Personality | Warm, approachable, optimistic | Rounded letterforms, generous spacing |

**Type scale:**

| Level | Size |
|---|---|
| H1 | 44px |
| H2 | 32px |
| Body | 17px |
| Small | 15px |

### Branding
- App name displayed as text ("Giftify") in Plus Jakarta Sans as a placeholder for MVP
- Home tab icon: stylized G — bold cream "G" centered in a terracotta circle (see giftify-icon.svg)

---

## 9. Views per Object

| Object | Views |
|---|---|
| PERSON | Card (list), Table Row, Detail |
| PRODUCT | Card (list), Table Row, Detail |
| GIFT | List (Gifts tab, filterable), Embedded in Person and Occasion detail views |
| HOLIDAY | List (Settings → Holiday management) |
| OCCASION | Dashboard card, List (Occasions tab), Detail |
| SETTINGS | Single settings page with sections |

---

## 10. Product Category Taxonomy

| # | Category | Example products |
|---|---|---|
| 1 | Books & Media | Books, audiobooks, magazines |
| 2 | Food & Drink | Coffee, wine, olive oil, chocolate, spice sets |
| 3 | Kitchen & Dining | Garlic press, cookware, serving boards, bar tools |
| 4 | Beauty & Skincare | Lotions, serums, perfume, bath products |
| 5 | Wellness & Self-Care | Candles, journals, massage tools, supplements |
| 6 | Home & Living | Throw blankets, décor, organizers, linens |
| 7 | Fashion & Accessories | Scarves, jewelry, bags, hats |
| 8 | Tech & Gadgets | Earbuds, chargers, smart home devices |
| 9 | Toys & Games | Board games, puzzles, kids toys |
| 10 | Sports & Outdoors | Gear, apparel, water bottles |
| 11 | Garden & Plants | Seeds, tools, planters, succulents |
| 12 | Art & Crafts | Sketchbooks, paints, craft kits |
| 13 | Stationery & Paper | Notebooks, pens, planners, greeting cards |
| 14 | Experiences | Classes, subscriptions, gift cards, event tickets |
| 15 | Baby & Kids | Clothing, nursery items, educational toys |
| 16 | Pets | Treats, toys, accessories |
| 17 | Subscription Boxes | Curated monthly boxes (beauty, snacks, books, etc.) |
| 18 | Other | Catch-all |

---

## 11. Out of Scope for MVP

- Multi-user collaboration / shared lists
- Direct purchase integration (buy button)
- Wishlist management (what others want to give *you*)
- Import from contacts (Google, Apple)
- Social or public profiles

---

## 12. Future Scope (MLP / Post-MVP)

| Feature | Notes |
|---|---|
| In-app product search | Google-like search across multiple retailers simultaneously |
| Retailer API integrations | Amazon, Walmart, Target, Nordstrom product APIs |
| Import contacts | Google Contacts / Apple Contacts import for People |
| Push notifications | Browser push or native push |
| Multi-user sharing | Share a gift list with a spouse or partner |
| Wishlist management | Track what others want to give you |
