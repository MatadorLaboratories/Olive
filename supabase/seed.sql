-- =====================================================================
-- Olive Linen — production seed data
-- ---------------------------------------------------------------------
-- Run this AFTER applying the three migrations in `supabase/migrations/`.
--
--   supabase db reset          (applies migrations + this seed locally)
--   psql -f supabase/seed.sql  (or run the SQL editor in Supabase Studio)
--
-- This file is idempotent — every insert uses ON CONFLICT, so re-running
-- after edits in /admin/cms or /admin/products will not clobber updates.
-- =====================================================================

-- ----- products -----------------------------------------------------------
insert into public.products (slug, kind, status, name, category, fabric, colour, size, description, short_description, hero_image_url, gallery_urls, hire_price_cents, retail_price_cents, replacement_cost_cents, display_order)
values
  ('scallop-napkin-bone', 'both', 'active', 'Scallop napkin', 'napkin', '100% French linen, scallop edge', 'Bone', '50 × 50 cm',
   $D$The original Olive scallop. Hand-finished scallop edge, washed soft, in a warm bone tone that quietly disappears into a wedding palette without ever being beige. Sold and hired in sets of ten.$D$,
   'Hand-scalloped 100% French linen — the original Olive napkin.',
   'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1400&q=80',
   array['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
         'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80'],
   350, 1800, 4200, 10),

  ('scallop-napkin-clay', 'both', 'active', 'Scallop napkin', 'napkin', '100% French linen, scallop edge', 'Clay', '50 × 50 cm',
   'The scallop in clay — warm terracotta with the slightest pink. Reads softer than terracotta in candlelight, holds presence on a long table.',
   'Warm-terracotta scallop — softens beautifully in candlelight.',
   'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=1400&q=80',
   array['https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1400&q=80'],
   350, 1800, 4200, 20),

  ('scallop-napkin-olive', 'both', 'active', 'Scallop napkin', 'napkin', '100% French linen, scallop edge', 'Olive', '50 × 50 cm',
   'Deep dusted olive — a quietly moody scallop for autumn weddings, hospitality launches and the kind of dinner that ends well past midnight.',
   'The house olive. Quiet, moody, surprisingly versatile.',
   'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=1400&q=80',
   '{}',
   350, 1800, 4200, 30),

  ('plain-napkin-oat', 'hire', 'active', 'Plain napkin', 'napkin', 'Stonewashed linen, mitred edge', 'Oat', '50 × 50 cm',
   'The everyday napkin made beautiful. Heavyweight stonewashed linen with a clean mitred edge — meant for dinners that don''t need to perform.',
   'The everyday napkin, in stonewashed oat.',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80',
   '{}',
   250, null, 3200, 40),

  ('long-tablecloth-cream', 'hire', 'active', 'Long tablecloth', 'tablecloth', 'Heavyweight stonewashed linen', 'Cream', '3.0 × 1.6 m',
   'Our flagship long tablecloth, sized for ten-to-twelve guests. Soft drape, generous overhang, hand-finished hem.',
   'Long-table cream linen — soft drape, hand-finished hem.',
   'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
   '{}',
   4500, null, 24000, 50),

  ('long-tablecloth-sage', 'hire', 'active', 'Long tablecloth', 'tablecloth', 'Heavyweight stonewashed linen', 'Sage', '3.0 × 1.6 m',
   'Sage-toned linen tablecloth with the same generous drape and finish as the cream. Disappears beautifully into a green-tone wedding palette.',
   'Long tablecloth in dusty sage.',
   'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=80',
   '{}',
   4500, null, 24000, 60),

  ('runner-olive', 'both', 'active', 'Table runner', 'runner', 'Soft linen, frayed edge', 'Olive', '3.5 × 0.5 m',
   'A long olive runner with frayed selvedge — laid down the centre of a long table, draped over a sweetheart, or used to soften an otherwise hard surface.',
   'Frayed-edge olive runner — long, soft, deeply useful.',
   'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
   '{}',
   1800, 9800, 16000, 70),

  ('runner-clay', 'both', 'active', 'Table runner', 'runner', 'Soft linen, frayed edge', 'Clay', '3.5 × 0.5 m',
   'Clay-toned long runner — warm, lived-in, ages beautifully. Pairs with bone scallop napkins for an autumnal wedding palette.',
   'Long clay runner — warm and lived-in.',
   'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
   '{}',
   1800, 9800, 16000, 80),

  ('napkin-set-gift-box', 'retail', 'active', 'Set of six scallop napkins', 'gift', '100% French linen, scallop edge', 'Mixed — bone, clay, olive', '50 × 50 cm',
   'A post-wedding gift set. Six hand-scalloped napkins in our three house colours, packed in a linen-wrapped box with care notes.',
   'Six house scallop napkins, linen-wrapped.',
   'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=1400&q=80',
   '{}',
   null, 12800, null, 90),

  ('olive-leaf-candle', 'retail', 'active', 'Olive-leaf candle', 'merch', 'Coconut & soy wax, recycled glass', 'Olive glass', '180g, 35hr burn',
   $D$Our house candle, made for the studio. A green, slightly herbal nose — olive leaf, salt, vetiver — with the kind of throw that fills a room without hijacking dinner.$D$,
   'House candle. Olive leaf, salt, vetiver.',
   'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
   '{}',
   null, 5800, null, 100)
on conflict (slug) do update
  set name = excluded.name,
      hero_image_url = excluded.hero_image_url,
      hire_price_cents = excluded.hire_price_cents,
      retail_price_cents = excluded.retail_price_cents,
      replacement_cost_cents = excluded.replacement_cost_cents,
      display_order = excluded.display_order;

-- ----- inventory_items ---------------------------------------------------
-- Aggregate per-product stock. Tweak these numbers to your real counts.
insert into public.inventory_items (product_id, total_qty, damaged_qty, lost_qty, retired_qty)
select id,
       case slug
         when 'scallop-napkin-bone'   then 360
         when 'scallop-napkin-clay'   then 280
         when 'scallop-napkin-olive'  then 280
         when 'plain-napkin-oat'      then 480
         when 'long-tablecloth-cream' then 30
         when 'long-tablecloth-sage'  then 24
         when 'runner-olive'          then 50
         when 'runner-clay'           then 42
         when 'napkin-set-gift-box'   then 80
         when 'olive-leaf-candle'     then 60
         else 0
       end,
       case slug
         when 'scallop-napkin-bone'   then 8
         when 'scallop-napkin-clay'   then 4
         when 'scallop-napkin-olive'  then 6
         when 'plain-napkin-oat'      then 14
         when 'long-tablecloth-cream' then 1
         else 0
       end,
       case slug
         when 'scallop-napkin-bone'   then 12
         when 'scallop-napkin-clay'   then 6
         when 'scallop-napkin-olive'  then 4
         when 'plain-napkin-oat'      then 22
         when 'long-tablecloth-sage'  then 1
         when 'runner-olive'          then 2
         when 'runner-clay'           then 1
         else 0
       end,
       case slug
         when 'scallop-napkin-bone'   then 20
         when 'scallop-napkin-clay'   then 10
         when 'scallop-napkin-olive'  then 12
         when 'plain-napkin-oat'      then 18
         when 'long-tablecloth-cream' then 2
         when 'long-tablecloth-sage'  then 2
         when 'runner-olive'          then 3
         when 'runner-clay'           then 2
         else 0
       end
from public.products
on conflict (product_id) do update
  set total_qty   = excluded.total_qty,
      damaged_qty = excluded.damaged_qty,
      lost_qty    = excluded.lost_qty,
      retired_qty = excluded.retired_qty;

-- ----- portfolio_items ---------------------------------------------------
insert into public.portfolio_items (slug, title, venue, event_date, cover_url, gallery_urls, short_description, body_md, vendors, published, display_order)
values
  ('charlotte-and-theo', 'Charlotte & Theo', 'Glenorchy Estate', '2024-03-23',
   'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80',
   array['https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80',
         'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
         'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80',
         'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1600&q=80'],
   'A long-table autumn wedding at Glenorchy Estate, dressed in bone scallop napkins and a long olive runner.',
   'Charlotte and Theo wanted a wedding that felt like dinner with eighty of their favourite people. We dressed three long tables in cream linen, ran an olive table runner the length of each, and hand-folded ninety scallop napkins in bone. The candlelight did the rest.',
   array['Eames & Co. — Planning', 'Studio Field — Photography', 'Wakatipu Catering', 'Glenorchy Estate'],
   true, 10),

  ('vines-and-light', 'Vines & Light', 'Wanaka Wines', '2024-12-14',
   'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80',
   array['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80',
         'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80'],
   'A high-summer wedding among the vines — clay scallop napkins, low ceramics, an unhurried lunch.',
   'We dressed sixty seats among the rows for a December wedding at Wanaka Wines. The brief was warm, low and unhurried. Clay scallops paired with a stonewashed cream cloth and a runner of olive — the warmest possible reading of a Central Otago summer.',
   array['Wanaka Wines', 'Roper & Sons — Florals', 'Sea Salt Catering'],
   true, 20),

  ('lake-dinner', 'Lake dinner', 'Private residence — Kelvin Heights', '2024-10-05',
   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
   array['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
         'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80'],
   'A private dinner for thirty-two on the deck of a Kelvin Heights home, dressed entirely in cream and clay.',
   'Three long tables on the deck, water in three directions. We served simple — a cream cloth, clay scallops, an olive runner — because the lake was already doing the work. The host''s only request was that the linen feel lived-in, like it had been pulled from a drawer that morning.',
   array['Margot Group — Catering', 'Studio Field — Photography'],
   true, 30),

  ('margot-queenstown-launch', 'Margot Queenstown launch', 'Margot Group, Queenstown', '2024-08-09',
   'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=1600&q=80',
   array['https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=1600&q=80'],
   'Custom hospitality napkins for the Margot Group''s Queenstown launch — branded in clay-stitched linen.',
   'Margot Group commissioned 240 custom napkins for the launch of their Queenstown restaurant — heavy linen, mitred edge, a small embroidered logo in our clay thread. The napkins now live as part of the venue''s permanent service.',
   array['Margot Group', 'Olive — Custom hospitality'],
   true, 40)
on conflict (slug) do update
  set title             = excluded.title,
      cover_url         = excluded.cover_url,
      gallery_urls      = excluded.gallery_urls,
      short_description = excluded.short_description,
      body_md           = excluded.body_md,
      vendors           = excluded.vendors,
      published         = excluded.published,
      display_order     = excluded.display_order;

-- ----- testimonials ------------------------------------------------------
-- Slug-keyed via attribution + event so re-runs don't dupe.
delete from public.testimonials
 where attribution in ('Maeve & Henry', 'Reuben Sharp', 'Charlotte Eames')
   and (event = 'March 2024' or role = 'Owner, Margot Group' or role = 'Eames & Co. Wedding Planning');

insert into public.testimonials (quote, attribution, role, event, display_order, published)
values
  ('Olive turned our long-table dinner into the picture I had in my head for two years. The scallop napkins were a moment.',
   'Maeve & Henry', 'Glenorchy Estate', 'March 2024', 10, true),
  ('We use Olive across three of our restaurants now. The team is unflappable, the linen is always immaculate, and the brand fits ours.',
   'Reuben Sharp', 'Owner, Margot Group', null, 20, true),
  ('I have planned ninety-something weddings. The trade portal is the easiest re-booking experience I''ve had with any supplier.',
   'Charlotte Eames', 'Eames & Co. Wedding Planning', null, 30, true);

-- ----- cms_blocks --------------------------------------------------------
insert into public.cms_blocks (key, data) values
  ('home.hero', $J${
    "eyebrow": "Premium linen hire — Queenstown, NZ",
    "headlineLines": ["Linen, laid", "like a love letter", "to the table."],
    "supporting": "Considered linen for weddings, private events and hospitality — hand-finished, beautifully laundered, delivered the length of the South Island.",
    "primaryCta": { "label": "Book linen", "href": "/hire" },
    "secondaryCta": { "label": "See real weddings", "href": "/portfolio" },
    "tagline": "Like the olive to your martini",
    "images": {
      "primary": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80",
      "collage": "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=800&q=80",
      "tag": "Est. Queenstown"
    }
  }$J$::jsonb)
on conflict (key) do nothing;

insert into public.cms_blocks (key, data) values
  ('home.brand_statement', $J${
    "eyebrow": "The Studio",
    "headlineLines": [
      "We don't dress tables.",
      "We undress them.",
      "Soft scallops. Slow folds.",
      "A martini in the right glass."
    ],
    "body": "Olive is a small, considered linen studio in the Wakatipu basin. We hire premium linen for weddings, private events and the kind of dinners that go on too long. Every napkin is washed in our studio, hand-pressed, and delivered ready to be loved.",
    "stats": [
      { "label": "Founded", "value": "2022" },
      { "label": "Events served", "value": "300+" },
      { "label": "Linen pieces", "value": "12,000" },
      { "label": "Trade partners", "value": "40+" }
    ],
    "pullQuote": {
      "quote": "Soft, dusty, considered. The way Saturdays should feel.",
      "attribution": "Vogue Living, Spring '24"
    },
    "images": [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
    ]
  }$J$::jsonb)
on conflict (key) do nothing;

insert into public.cms_blocks (key, data) values
  ('about.body', $J${
    "eyebrow": "The Studio",
    "headlineLines": ["We make small details", "feel like big ones."],
    "body": "Olive Linen began on a long table in Queenstown, with one set of scallop napkins and the suspicion that a wedding could feel a little softer. Three seasons later, the studio dresses some of New Zealand's most loved private events, restaurants and venues — quietly, beautifully, on time.",
    "promiseQuote": "Every piece washed, pressed and folded by hand in our studio. Every booking answered by a person, not a portal. Every event treated like our own.",
    "blocks": [
      { "title": "Founded", "body": "By a small team in the Wakatipu basin who couldn't find linen they loved enough." },
      { "title": "Made for", "body": "Weddings, private events, hospitality venues, brands who care about the table." },
      { "title": "Where",   "body": "Queenstown, New Zealand — delivering through Central Otago and the South Island." }
    ],
    "coverImage": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80"
  }$J$::jsonb)
on conflict (key) do nothing;

insert into public.cms_blocks (key, data) values
  ('hospitality.options', $J${
    "fabrics": [
      { "id": "linen",         "label": "100% French linen" },
      { "id": "cotton",        "label": "Cotton" },
      { "id": "cotton_rayon",  "label": "Cotton-rayon blend" },
      { "id": "polyester",     "label": "Polyester (high-volume hospitality)" }
    ],
    "edges": [
      { "id": "plain",     "label": "Plain mitred" },
      { "id": "trimmed",   "label": "Trimmed edge" },
      { "id": "scallop",   "label": "Hand-finished scallop" },
      { "id": "specialty", "label": "Specialty (consult studio)" }
    ],
    "colours": [
      { "id": "bone",  "label": "Bone",  "hex": "#EFE8D6" },
      { "id": "cream", "label": "Cream", "hex": "#F4EFE6" },
      { "id": "oat",   "label": "Oat",   "hex": "#E6DCC3" },
      { "id": "olive", "label": "Olive", "hex": "#4F603A" },
      { "id": "sage",  "label": "Sage",  "hex": "#97A57B" },
      { "id": "clay",  "label": "Clay",  "hex": "#C8541C" },
      { "id": "stone", "label": "Stone", "hex": "#8E8478" },
      { "id": "ink",   "label": "Ink",   "hex": "#1D2616" }
    ],
    "quantityTiers": [
      { "id": "small_set", "label": "Gift set (under 40)", "priceFromCents": 1800, "ppuCents": null },
      { "id": "tier_40",   "label": "40 – 99",             "priceFromCents": null, "ppuCents": 1450 },
      { "id": "tier_100",  "label": "100 – 499",           "priceFromCents": null, "ppuCents": 1180 },
      { "id": "tier_500",  "label": "500 – 999",           "priceFromCents": null, "ppuCents": 920 },
      { "id": "tier_1000", "label": "1,000 – 4,999",       "priceFromCents": null, "ppuCents": 760 },
      { "id": "tier_5000", "label": "5,000+",              "priceFromCents": null, "ppuCents": 580 }
    ],
    "customerTypes": [
      { "id": "restaurant",        "label": "Restaurant" },
      { "id": "bar",               "label": "Bar" },
      { "id": "hotel",             "label": "Hotel" },
      { "id": "venue",             "label": "Wedding or event venue" },
      { "id": "planner",           "label": "Planner / stylist" },
      { "id": "wedding_client",    "label": "Wedding client" },
      { "id": "corporate",         "label": "Corporate / brand" },
      { "id": "post_wedding_gift", "label": "Post-wedding gift" }
    ]
  }$J$::jsonb)
on conflict (key) do nothing;

insert into public.cms_blocks (key, data) values
  ('footer.contact', $J${
    "location": "Queenstown, Aotearoa New Zealand",
    "email": "hello@olivelinen.co.nz",
    "phone": "+64 (0)3 000 0000"
  }$J$::jsonb)
on conflict (key) do nothing;

insert into public.cms_blocks (key, data) values
  ('faqs', $J$[
    {
      "q": "How far in advance should I book?",
      "a": "For peak wedding season (December – April), we'd suggest at least nine months ahead. For private dinners and hospitality launches, six to eight weeks is plenty."
    },
    {
      "q": "Where do you deliver?",
      "a": "Queenstown, Wanaka, Arrowtown and Central Otago as standard. We can deliver further afield across the South Island — and we have done — there's just a travel charge."
    },
    {
      "q": "What if something is damaged or lost?",
      "a": "We expect normal wear. Items lost or damaged beyond repair are charged at replacement value, which is documented on every quote and invoice."
    },
    {
      "q": "Can we change our quantities after booking?",
      "a": "Yes — until 30 days before your event. After that the studio approves changes by exception, because stock and laundering are already locked in."
    },
    {
      "q": "Do you offer trade pricing?",
      "a": "Yes. Wedding planners, stylists and venues with a trade history with us are eligible for trade-tier discounts. Apply via the trade portal."
    }
  ]$J$::jsonb)
on conflict (key) do nothing;

-- ----- email_templates ---------------------------------------------------
insert into public.email_templates (key, subject, body_md, active) values
  ('booking.confirmation',
   'Your booking is confirmed — {{reference}}',
   $T$Hi {{firstName}},

Your booking **{{reference}}** is confirmed. We've received your deposit of **{{depositAmount}}** and your event is locked into the studio calendar.

**Event** — {{eventDate}}
**Delivery** — {{deliveryDate}}
**Venue** — {{venue}}

Your final balance of **{{outstandingAmount}}** is due 30 days before your event. We'll send a reminder.

You can view your booking, message the studio, and upload your timeline anytime from your portal:
{{portalUrl}}

Thanks for choosing us — we're looking forward to dressing the table.

— Olive Linen
*Like the olive to your martini.*$T$,
   true),

  ('booking.final_paid',
   'Final balance received — thank you',
   $T$Hi {{firstName}},

We've received your final payment of **{{amount}}** for booking **{{reference}}**. You're fully paid up — thank you.

We'll be in touch a few days before to confirm timings.

— Olive Linen$T$,
   true),

  ('booking.final_reminder.30',
   'Final balance — coming up · {{reference}}',
   $T$Hi {{firstName}},

A friendly note that your final balance of **{{outstandingAmount}}** for booking **{{reference}}** is due **{{finalDueDate}}** — 30 days before your event.

You can pay anytime from your portal:
{{portalUrl}}

— Olive Linen$T$,
   true),

  ('booking.final_reminder.14',
   'Final balance — two weeks out · {{reference}}',
   $T$Hi {{firstName}},

Two weeks until {{eventDate}}. Your final balance of **{{outstandingAmount}}** is overdue — please clear it from your portal as soon as you can:
{{portalUrl}}

— Olive Linen$T$,
   true),

  ('booking.final_reminder.7',
   'Final balance — this week · {{reference}}',
   $T$Hi {{firstName}},

This is your final reminder — your balance of **{{outstandingAmount}}** is owing for booking **{{reference}}**, with the event coming up on {{eventDate}}.

Pay from the portal:
{{portalUrl}}

If something has come up, please message the studio and we'll work it out.

— Olive Linen$T$,
   true),

  ('vendor.approved',
   'Your trade account is approved',
   $T$Welcome aboard, {{firstName}}.

Your trade account for **{{businessName}}** is approved. You've been set to **{{tier}}** ({{discountPct}}% off hire pricing).

Sign in anytime — your discount applies automatically when you book on behalf of a client.
{{portalUrl}}

— Olive Linen$T$,
   true),

  ('custom_order.quote_sent',
   'Your napkin quote — {{reference}}',
   $T$Hi {{firstName}},

Your custom napkin quote is ready. Total: **{{quoteTotal}}**.

Reply to this email to accept or ask any questions. Once we have the green light, we'll send a deposit invoice and start production.

— Olive Linen$T$,
   true)
on conflict (key) do update
  set subject = excluded.subject,
      body_md = excluded.body_md,
      active  = excluded.active;

-- =====================================================================
-- All seeded. Two things you'll still want to do manually after this:
--
--   1. Sign up your studio email at /signup. The trigger created in
--      the latest bootstrap-admin migration will assign the 'admin' role
--      if the signup email matches the configured bootstrap email.
--
--      OR upgrade an existing profile manually:
--
--        update public.profiles set role = 'admin' where email = 'you@studio.co.nz';
--
--   2. Replace product / portfolio / hero imagery via /admin once the
--      real Olive shoot is in. The seed URLs above are placeholders.
-- =====================================================================
