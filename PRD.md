# Giftify — Product Requirements Document

**Version:** 3.0 (MVP — complete)
**Author:** Michelle Kurzynski
**Date:** June 2026
**Status:** Complete. All MVP features built and deployed.

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

A single product (or a single free-text item) intended for or given to one or more people, typically for an occasion. Gifts have two states: **planned** (intended for a future occasion) and **given** (already recorded as given). Each gift contains exactly one product from the library or one free-text description — multiple gifts can be given to the same person for the same occasion, but each is recorded separately.

| Attribute | Type | Notes |
|---|---|---|
| Gift Name | String | e.g., "4,000 Weeks for Ashley"; auto-suggested from product + recipient name |
| Status | Enum | `planned` or `given`; defaults to `given` |
| Product | Link to Product | Optional; exactly 1 product from the library, OR 1 free-text description (e.g., "$50 cash", "Amazon gift card") — can be left as "To be decided" for planned gifts |
| Occasion | Link to Occasion | Required |
| Date Given | Date | Set when status is `given`; defaults to today; editable for retroactive logging |
| Planned Date | Date | Set when status is `planned`; the intended give date; auto-fills from occasion date |
| Message / Note | Text | Personal note attached to this gift |
| Custom Image | Image | Optional override photo |

**Relationships:**
- A Gift goes to 1–many Persons (recipients)
- A Gift is associated with exactly 1 Occasion
- A Gift may have 0–many related Gifts (by shared person/occasion)

**AI actions:** Suggest a gift for a person for an occasion.
**Giver actions:** Log a past gift; plan a future gift; mark a planned gift as given (confirms date); edit a gift; delete a gift (with confirmation prompt).

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

### F3 — Gift Recording & Planning
- Two entry points on the Gifts tab: **"Log past gift"** (terracotta) and **"Plan future gift"** (sage green); also accessible via "Record gift" shortcuts on Person and Occasion detail views
- Each gift contains exactly one product from the library, one free-text description, or "To be decided" (planned gifts only); multiple gifts can be recorded for the same person and occasion separately
- Both flows use a 5-step modal with a progress bar, back navigation, and a bold step header question at the top of each step (wording differs between log and plan flows):
  1. **Recipients** — "Who did you give this to?" / "Who is this gift for?" — select one or more people (searchable); inline "+ Add person" opens a mini-form (first name, last name, optional birthday month + day) with auto-selection on save; "You can add more details from the People tab later" note shown
  2. **Gift** — "What did you give?" / "What will you give?" — "From library" (default), "Free text", or "Decide later" (plan flow only); in From library mode, "+ Add product" opens a mini-form (URL + ✨ auto-fill, name, price) with auto-selection on save; "+ Add product" is hidden once a product is already selected; "You can add more details from the Products tab later" note shown
  3. **Occasion** — "What was the occasion?" / "What's the occasion?" — required; select from existing occasions; inline "Add occasion" creates a new one on the spot with date validation (past dates only in log flow; today or future only in plan flow)
  4. **Details** — "When did you give it?" / "When are you giving it?" — gift name (auto-suggested as "{Product} for {Recipient}", always editable) + date field ("Date given" for log flow defaulting to today; "Planned date" for plan flow auto-filling from occasion date)
  5. **Note** — "Any notes?" — optional personal message
- **Planned gifts** show a prominent "Mark as given ✓" button on their detail page; tapping it confirms the actual give date and converts the gift to `given` status
- Notifications (future): planned gifts trigger reminders before their planned date
- Gifts can be edited or deleted after recording; deletion requires a confirmation prompt
- Gift history displayed on both Person and Occasion detail views with a "Record gift" shortcut on each

### F4 — Holidays & Occasions
- System pre-loads the following 15 holidays. System holidays cannot be edited or deleted; they are visually distinguished from user-created holidays in Settings.

| Holiday | Anchor Date | Date Calculation |
|---|---|---|
| Birthday | Per-person | Auto-created when a Person's birthday field is saved |
| Christmas | December 25 | Fixed |
| Valentine's Day | February 14 | Fixed |
| Mother's Day | May (2nd Sunday) | Calculated algorithmically each year |
| Father's Day | June (3rd Sunday) | Calculated algorithmically each year |
| Hanukkah | Varies | Hard-coded verified dates through 2035 (Hebrew calendar) |
| Diwali | Varies | Hard-coded verified dates through 2035 (Hindu calendar) |
| Thanksgiving | November (4th Thursday) | Calculated algorithmically each year |
| Easter | Varies | Calculated algorithmically each year (Meeus algorithm) |
| Passover | Varies | Hard-coded verified dates through 2035 (Hebrew calendar) |
| Eid al-Fitr | No fixed date | User sets date per year (quick-start chip in Add occasion) |
| New Year's | January 1 | Fixed |
| Wedding / Anniversary | No fixed date | User sets date (quick-start chip in Add occasion) |
| Baby Shower | No fixed date | User sets date (quick-start chip in Add occasion) |
| Graduation | No fixed date | User sets date (quick-start chip in Add occasion) |

- **Auto-generation:** When the user visits the Occasions tab, the system lazily ensures one upcoming occasion exists per fixed-date/anchor-date system holiday (rolling: once a holiday passes, next year's is automatically created on the next page load). Mother's Day, Father's Day, Thanksgiving, and Easter are calculated algorithmically. Hanukkah, Passover, and Diwali use verified hard-coded dates through 2035 (sourced from Chabad.org and authoritative Hindu calendar references).
- Birthday occasions auto-generate for the next upcoming birthday only; rolling forward year to year.
- **Occasions tab views:** List view with **Upcoming** tab (all future occasions, soonest first) and **Past** tab (all past occasions, most recently passed first). Calendar view (monthly, with dots on mobile and occasion name chips on desktop). A list/calendar toggle switches between views.
- **Add occasion:** The modal is for **one-off occasions only**. Includes Quick Start chips that pre-fill the occasion name, in order: Birthday 🎂, Wedding/Anniversary 💍, Baby Shower 👶, Graduation 🎓, Eid al-Fitr 🌙. Eid al-Fitr also shows a "find [year] date →" link since its date varies by moon sighting.
- Recipients are **not** set on occasions — they are tracked via gifts recorded for that occasion.
- Dashboard shows upcoming occasions in the next 90 days with a days-until indicator.
- Occasion detail: planned/given gifts, AI suggestions; parent holiday shown as tappable link to Settings → Holiday Management.
- "Manage Holidays" button on Occasions page → Settings → Holiday Management; Settings shows "← Back to Occasions" when navigated from there.
- User can add fully custom holidays in Settings → Holiday Management.

### F5 — AI Features (Gemini 2.0 Flash)
All AI features run via Supabase Edge Functions so the Gemini API key is never exposed client-side.

**URL auto-fill (Product Library):**
- When adding a product, paste a URL and click "Auto-fill ✨" — the `parse-product-url` Edge Function fetches the page and calls Gemini to extract product name, price, and photo URL
- If the page cannot be fetched or parsed, an inline error is shown and the user fills in details manually

**Gift suggestions (Person & Occasion detail):**
- Surfaced via a "Gift ideas" panel on Person and Occasion detail views:
  - **Mobile:** Horizontal scrollable strip pinned above the bottom tab bar; user taps "Get ideas" to load
  - **Desktop:** Collapsible right sidebar (toggled with chevron); user clicks "Get ideas" to load
- The `suggest-gifts` Edge Function receives: person profile (gender, pronouns, religion), occasion context, full gift history for that person, and the user's product library
- Returns up to 5 ranked product suggestions with a one-sentence reason each
- Suggestions prioritise products not yet given to that person
- User can refresh suggestions at any time
- Religion is passed as optional context, not as a hard filter

### F6 — Dashboard / Home
- **Quick stats row:** Three tappable cards — "People received a gift" (distinct recipients across all given gifts), "Gifts given" (total count), and "Gifts planned" (total count); stacked single-column on mobile, 3-across from `sm` breakpoint up; first links to People tab, other two link to Gifts tab
- **Gifts to give:** Planned gifts section (only shown when planned gifts exist); shows up to 3 with days-until chips; links to Gifts tab
- **Upcoming occasions:** Next 5 occasions in the next 90 days, soonest first, with days-until chips; "View all" link to Occasions tab; empty state if none in window
- **Recent gifts given:** Last 5 given gifts with recipient avatars, occasion, and date; "View all" link to Gifts tab; empty state with "Log your first gift →" link
- **Quick actions:** Four buttons — Log a gift (terracotta), Plan a gift (sage), Add a person, Add a product; own section below Quick stats, 2x2 grid up to `lg`, single row of 4 from `lg` breakpoint up
- **First-time empty state:** Shown when no people AND no products exist; friendly welcome with two CTAs ("Add the people you love" → People tab, "Add a product to your library" → Products tab); no wizard, no sample data

### F7 — Gifts List
- Accessible via the Gifts tab in the bottom nav
- Two tabs: **Upcoming** (planned gifts, soonest first, sage green accent) and **Given** (logged gifts, most recent first, terracotta accent)
- Calendar view (monthly) shows planned gifts on their intended dates; dots on mobile, name chips on desktop — toggled via list/calendar icon
- Each row shows: recipient avatar(s), gift name, "Planned" badge (for planned gifts), recipients, occasion, and date
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
- **Header:** App name ("Giftify" in Plus Jakarta Sans, text-based placeholder for MVP) on the left; avatar circle on the right linking to Settings, showing the first letter of the user's display name (set in Settings → Account)
- **Back navigation:** All detail views show a back chevron ("←") in the top-left of the header labeled with the parent screen name (e.g., "← Occasions"); bottom tab bar remains visible throughout

### Tablet (768px+) and Desktop (1024px+)
- Bottom tab bar transitions to a left sidebar or top navigation
- Grid layouts expand: single-column → 2-column → 3-column
- Person and Occasion detail views use a two-column layout: main content on the left (~65%), AI suggestions sidebar on the right (~35%); sidebar is collapsible/expandable via a chevron toggle, expanded by default

---

## 8. Design Principles

- **Mobile-first:** Core flows designed for 375px width first; expanded for 768px (tablet) and 1024px+ (desktop)
- **Responsive:** Single-column → 2-column → 3-column grid progression; fluid layouts
- **Page width:** Main content area is capped at `max-w-[1800px]` (centered) so the app reads as full-width on typical screens while avoiding excessive line lengths on ultra-wide monitors
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

---

## 13. Build State & Implementation Notes

> This section documents what has been built, the exact database migrations, Supabase configuration, and what remains. It exists so the app can be fully reconstructed from the PRD alone.

### 13.1 What Is Built (as of June 2026)

| Feature | Status |
|---|---|
| Project scaffold (React + Vite + TypeScript + Tailwind CSS v4 + Supabase client) | ✅ Done |
| Plus Jakarta Sans font + brand colors in src/index.css | ✅ Done |
| App shell: Header, BottomNav (mobile), Sidebar (desktop 768px+), AppShell layout | ✅ Done |
| Header avatar shows first letter of display name (from Settings → Account) | ✅ Done |
| Auth: magic link, password sign-in, create account, forgot password, confirmation screens | ✅ Done |
| People: list (card + table views), detail, add/edit modal, archive/unarchive, delete, search, pagination | ✅ Done |
| Combobox component: searchable select, shows all options on focus, must select from predefined list | ✅ Done |
| Products: list (card + table views), detail, add/edit modal, photo upload (Supabase Storage), archive/unarchive, delete, favorites, search, category filter, pagination | ✅ Done |
| Product image display: square area, object-contain, white background with padding — never cropped | ✅ Done |
| Holidays + Occasions: 15 system holidays, ensureSystemOccasions (rolling lazy creation), Upcoming/Past tabs, calendar view, Add occasion modal with Quick Start chips, Settings holiday management | ✅ Done |
| Gifts: two entry points (Log past / Plan future), 5-step modal with mode-aware flows, auto-suggested gift name, Upcoming/Given tabs, calendar view, Gift detail with "Mark as given ✓", gift history on Person + Occasion detail | ✅ Done |
| Gift modal — step headers: each step shows a bold question header; wording differs between log and plan flows | ✅ Done |
| Gift modal — inline Person creation in Step 1: "+ Add person" opens mini-form (first/last name + optional birthday); auto-selects new person as recipient | ✅ Done |
| Gift modal — inline Product creation in Step 2 (From library mode): "+ Add product" opens mini-form (URL + ✨ auto-fill, name, price); hidden once a product is already selected | ✅ Done |
| Combobox: filters by label (contains) and value (prefix match); trailing space triggers exact value match; used for birthday month in gift modal | ✅ Done |
| Dashboard (Home tab): quick stats, gifts to give, upcoming occasions (90 days), recent gifts given, quick actions, first-time empty state | ✅ Done |
| AI — parse-product-url Edge Function: URL → Gemini 2.0 Flash → auto-fills product name, price, photo | ✅ Done |
| AI — suggest-gifts Edge Function: person profile + gift history + products → ranked suggestions | ✅ Done |
| Notifications — notification_settings table: one row per user, lead_times integer[] | ✅ Done |
| Notifications — Settings → Notifications tab: checkboxes wired to DB, Save button persists preferences | ✅ Done |
| Notifications — send-reminders Edge Function (daily cron, Resend email) | ✅ Done |
| App deployed to Vercel | ✅ Done |
| App-wide max-width container (`max-w-[1800px]`, centered) on main content area | ✅ Done |
| Layout/responsive design pass (mobile-first → adaptive restructuring across pages); Home dashboard reworked first | 🔄 In progress |
| Developer setup guide | ❌ Not yet written |

### 13.2 Database Migrations (run in this order)

| File | Description | Notes |
|---|---|---|
| 001_create_people.sql | people table | |
| 002_flexible_people_fields.sql | NOT run — constraints kept | Skip this one |
| 003_create_products.sql | products table | |
| 004_storage_product_images.sql | Supabase Storage bucket for product images | |
| 005_create_holidays_occasions.sql | holidays, occasions, occasion_people tables; 15 system holidays seeded | |
| 006_cleanup_duplicate_occasions.sql | removes duplicate occasions | |
| 007_occasions_unique_constraint.sql | unique constraint on occasions | |
| 008_cleanup_2027_occasions.sql | removes incorrect 2027 occasions | |
| 009_fix_diwali_hanukkah_2026.sql | corrects Diwali and Hanukkah 2026 dates | |
| 010_create_gifts.sql | gifts and gift_recipients tables | |
| 011_gifts_planned_status.sql | adds planned status + planned_date column | |
| 012_gifts_date_given_nullable.sql | makes date_given nullable for planned gifts | |
| 013_create_notification_settings.sql | notification_settings table with RLS policies | After running, also run the GRANT and policy manually — see note below |
| 014_reminder_function.sql | `get_reminder_occasions()` SQL function — joins auth.users + notification_settings + occasions + occasion_people + people to return all (user, occasion, person) rows due for a reminder today | SECURITY DEFINER; called by send-reminders Edge Function |
| 015_cron_send_reminders.sql | pg_cron job: calls send-reminders Edge Function daily at 9 AM UTC via net.http_post | Requires pg_cron and pg_net extensions — both enabled by default on Supabase managed instances |

**Important:** After running migration 013, also run this manually in the SQL Editor — tables created via raw SQL do not automatically get API access:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_settings TO authenticated;
```

Also run this policy for full upsert support:
```sql
CREATE POLICY "Users can upsert their own notification settings"
  ON notification_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Rule:** Every migration that creates a table via raw SQL must include a `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated;` statement, or all Data API calls will return 403.

### 13.3 Supabase Configuration

**Project ref:** `mdygugjxdfdfhkkcrbfx`

**Secrets (set via `supabase secrets set KEY=value`):**
- `GEMINI_API_KEY` — Google AI Studio key for Gemini 2.0 Flash
- `RESEND_API_KEY` — Resend API key for email notifications
- (Supabase auto-injects `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` into every Edge Function — do not set these manually)

**Storage bucket:** `product-images` (public bucket for product photos)

**Edge Functions deployed:**
- `parse-product-url` — called by "Auto-fill ✨" button in ProductForm
- `suggest-gifts` — called by GiftSuggestions component on Person and Occasion detail
- `send-reminders` — daily cron at 9 AM UTC; queries `get_reminder_occasions()` SQL function and sends HTML digest emails via Resend; uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS

**Auth redirect URLs** — must be added in Supabase Dashboard → Authentication → URL Configuration:
- `http://localhost:5173/**` (local dev)
- `https://giftify-lake.vercel.app/**` (production)
- Site URL: `https://giftify-lake.vercel.app`

**Cron schedule:** `send-reminders` runs daily at 9 AM UTC via pg_cron (configured in migration 015). The cron calls the function using the JWT-format anon key — not the `sb_publishable_*` format. The JWT anon key is found in Supabase Dashboard → Settings → API → "anon public".

**Email sender:** Currently `onboarding@resend.dev` (Resend test sender). To send to external addresses in production, a verified sending domain must be configured in Resend and the `from` field in `send-reminders/index.ts` updated accordingly.

### 13.4 Deployment

**Live app:** https://giftify-lake.vercel.app
**Platform:** Vercel (free tier; auto-deploys on push to `main` branch of GitHub repo)
**GitHub repo:** Connected to Vercel; pushing to `main` triggers a new deployment automatically

**Vercel environment variables** (set in Vercel Dashboard → Project → Settings → Environment Variables):
- `VITE_SUPABASE_URL` = `https://mdygugjxdfdfhkkcrbfx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = *(the `sb_publishable_*` key from the `.env` file)*

**SPA routing:** `vercel.json` at project root contains `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` — required for React Router to work on Vercel.

### 13.5 Project File Structure (key files)

```
src/
  pages/         — Home, People, PersonDetail, Products, ProductDetail,
                   Occasions, OccasionDetail, Gifts, GiftDetail, Settings
  components/
    ui/           — Combobox, shared UI components
    gifts/        — GiftModal, GiftCalendar, GiftSuggestions
    occasions/    — OccasionForm
    products/     — ProductForm
  lib/
    supabase.ts              — Supabase client
    people.ts                — people DB helpers
    products.ts              — products DB helpers
    gifts.ts                 — gifts DB helpers
    occasions.ts             — occasions DB helpers
    holidays.ts              — holidays DB helpers
    ensureOccasions.ts       — rolling system occasion creation
    notificationSettings.ts  — notification settings DB helpers
    utils.ts                 — shared utilities
  types/index.ts             — all TypeScript types
supabase/
  functions/
    parse-product-url/index.ts   — AI product URL auto-fill (Gemini)
    suggest-gifts/index.ts       — AI gift suggestions (Gemini)
    send-reminders/index.ts      — daily email reminders (Resend)
  migrations/                    — 001–015 (see 13.2)
vercel.json                      — SPA rewrite rule
```
