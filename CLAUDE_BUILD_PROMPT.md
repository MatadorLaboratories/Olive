Build Olive Linen as a premium, editorial full-stack web platform inside `/Users/callum/Dropbox/Mac/Desktop/Projects/Olive`.

You are the lead product designer, senior frontend engineer, senior backend engineer, and technical architect for this project. Work like an experienced agency-plus-startup founding team. Be decisive, highly competent, commercially aware, and detail-oriented.

Your goal is not just to make a marketing website. Your goal is to build a beautiful brand experience on the public side and a serious business operating system underneath it, with strong resale value for the company.

Context

Olive Linen is a premium linen hire company based in Queenstown, New Zealand. The platform needs to combine:

- A premium public-facing website
- A guided hire booking flow
- A client portal
- A vendor / trade portal
- A hospitality / custom napkin builder
- A robust admin dashboard for operations

The site should feel like a lifestyle/fashion brand, not a generic rental platform or standard ecommerce template.

Core Outcome

Build a responsive web app that feels editorial and premium on the front end, while functioning as a practical linen hire business management system on the back end.

Preferred Technical Direction

Use these defaults unless you find a compelling reason to improve them:

- Framework: Next.js with App Router and TypeScript
- Hosting target: Netlify
- Styling: Tailwind CSS plus carefully structured custom CSS variables for a premium visual system
- Component approach: reusable, production-grade UI components, not page-specific hacks
- Database / auth / storage: Supabase
- Payments: Stripe
- Forms / validation: robust schema validation with Zod
- State / data fetching: modern React + server actions where appropriate
- CMS approach: admin-managed content inside the application database, not a bolt-on CMS unless clearly justified
- File storage: Supabase Storage for uploads such as timelines, logos, documents, and inspiration images

If you change any major technical decision, explain why briefly in project docs before implementing.

Non-Negotiable Product Requirements

Public website pages:

- Home
- Hire Linen / Book Now
- Shop
- Portfolio
- Hospitality / Custom
- About
- Login
- Cart / checkout

Account types and roles:

- Public visitor
- Client
- Vendor / trade account
- Admin
- Future staff role with limited permissions

Key platform areas:

1. Public marketing website
- Premium editorial homepage
- Strong brand storytelling
- Featured products
- Portfolio / real weddings
- Testimonials
- Branded social proof / Instagram integration approach
- CMS-editable content

2. Hire booking flow
- Date selection first
- Inventory-aware product availability
- Product browsing by category, colour, size, and style
- Quantity selection
- Event and delivery details
- Account creation / login
- 50% deposit payment
- Final balance due 30 days before the event
- 30-day lock rule or admin-controlled changes after cutoff

3. Client portal
- Booking summary
- Payment status
- Edit booking until cutoff
- Timeline upload
- Messaging thread
- Documents area
- Order history

4. Vendor portal
- Vendor registration and approval flow
- Vendor-specific discounts or trade pricing
- Saved addresses and preferences
- Repeat bookings
- Client/event-linked jobs
- Spend tracking
- Messaging and documents

5. Hospitality / custom napkin builder
- Customer type selection
- Logo upload
- Inspiration uploads
- Material, style, and colour choices
- Quantity tiers
- Quote-only or payment-enabled flow
- Status tracking in admin

6. Admin dashboard
- Dashboard snapshot
- Calendar
- Bookings management
- Inventory management
- Products and pricing
- Finance overview
- Clients
- Vendors
- Wholesale / custom orders
- Enquiries
- Reports
- CMS content management

Brand and Design Direction

The visual direction is critical.

The site must feel:

- Editorial
- Fashion-inspired
- Warm
- Soft
- Premium
- Clean
- Slightly playful

It must not feel:

- Corporate
- Generic SaaS
- Warehouse/inventory software on the public side
- Like a default Shopify theme
- Like an AI-generated template

Design system direction:

- Soft cream / oat backgrounds
- Deep olive green text
- Warm orange accent used with restraint
- Sage and stone secondary tones
- Large serif-style display typography for hero statements
- Refined sans-serif for UI, forms, navigation, and body copy
- Asymmetrical layouts
- Collage-style image groupings
- Strong whitespace
- Editorial hierarchy
- Gentle motion only: fades, image reveals, hover polish, smooth transitions

Retain the brand line:

"like the olive to your martini"

Use it as a key brand moment somewhere prominent and tasteful.

Experience Principles

- The homepage should immediately communicate premium Queenstown linen hire with personality.
- Mobile must feel as premium as desktop.
- Booking should feel guided, visual, and reassuring, not bureaucratic.
- Admin should reduce workload, not simply store information.
- Every major workflow should be designed for clarity, speed, and future maintainability.

Build Strategy

Do not jump straight into disconnected coding.

First, create a clear implementation foundation:

1. Read this prompt carefully.
2. Create a concise execution plan in the repo.
3. Define the information architecture and route map.
4. Define the database schema and role model.
5. Define the design system foundations:
   - colours
   - typography
   - spacing
   - buttons
   - form controls
   - cards
   - content blocks
6. Scaffold the app cleanly.
7. Build the public experience first at a high visual standard.
8. Then build the booking flow and client portal.
9. Then build the admin operating system.
10. Then add vendor and custom-order workflows.

Execution Priorities

Treat this as the MVP priority order:

1. Premium public front end
2. Product CMS foundation
3. Inventory-aware booking flow
4. Client authentication and portal
5. Admin bookings and inventory
6. Payments and reminders
7. Vendor accounts
8. Hospitality / custom napkin builder
9. Secondary integrations

Architecture Expectations

Design this so it can scale without a rebuild.

Include:

- clean folder structure
- typed domain models
- reusable services for bookings, inventory, payments, and messaging
- role-based route protection
- auditable booking and payment states
- future-friendly integrations
- content model that lets a future owner edit key website content

Think through:

- product catalog structure for both hire and retail
- inventory allocation by date range
- booking lifecycle statuses
- payment lifecycle statuses
- quote lifecycle statuses
- vendor approval and discount models
- document storage and permissions
- admin reporting data needs

Operational Logic Expectations

Model important business rules explicitly, including:

- stock availability for chosen dates
- allocated vs available vs damaged vs lost stock
- deposit and final balance logic
- final payment due 30 days before event
- booking edit lock around the 30-day cutoff
- admin override path
- custom order statuses
- vendor approval states
- low-stock warnings
- double-booking prevention

Suggested Core Data Areas

At minimum, think in terms of:

- users
- profiles
- roles
- clients
- vendors
- staff permissions
- products
- product variants / attributes
- inventory records
- bookings
- booking items
- booking statuses
- delivery / collection details
- payments
- invoices / receipts metadata
- messages / threads
- documents / uploads
- portfolio items
- testimonials
- homepage / CMS content blocks
- enquiries
- quote requests
- custom orders
- tasks / reminders

Pages and UX You Should Build Well

Public side:

- A standout homepage with a premium hero, strong typography, collage imagery, service pathways, product previews, portfolio preview, testimonials, and tasteful social proof
- A strong portfolio experience
- Elegant product browsing
- A hospitality/custom page with a clear quote/buy flow
- A refined about page

Application side:

- Login / account entry
- Client dashboard
- Vendor dashboard
- Admin dashboard
- Booking detail pages
- Inventory views
- Product editor
- CMS editor

Engineering Quality Bar

- Use TypeScript properly
- Keep components focused and composable
- Avoid duplication
- Avoid weak placeholder architecture
- Avoid fake data dependencies once real models are available
- Add seed data only in a deliberate, documented way
- Use accessible semantics
- Handle loading, empty, success, and error states properly
- Keep forms resilient and validated
- Make the codebase easy for another strong developer to inherit

Documentation You Should Produce

Inside the repo, create clear internal documentation as you go, including:

- project overview
- architecture decisions
- setup instructions
- schema overview
- route map
- implementation phases
- outstanding assumptions / questions

Do not bury important decisions only in chat output. Put them in repo docs.

Working Style

- Be proactive and autonomous.
- Make strong decisions where the brief is clear.
- Where the brief leaves ambiguity, choose the most commercially sensible path and document assumptions.
- Do not lower the visual bar to move faster.
- Do not create bloated, over-engineered abstractions too early.
- Balance elegance with practicality.

What Not To Do

- Do not produce a generic template look
- Do not use default, bland typography choices
- Do not make the public site feel like admin software
- Do not make the admin area messy or underpowered
- Do not ignore mobile experience
- Do not skip data modeling
- Do not leave key flows half-designed
- Do not rely on huge third-party systems when the app can own the core logic cleanly

First Actions

Start by doing the following in order:

1. Initialize the project in this directory with the chosen stack.
2. Create a strong README and implementation plan.
3. Define the app structure, routes, and schema.
4. Build the design foundations.
5. Build a high-end homepage first.
6. Then continue through the booking, portal, and admin foundations in a staged way.

Output Expectations

As you work:

- Explain major decisions briefly and clearly
- Keep momentum high
- Update documentation
- Implement real structure, not just mockups
- Prefer production-ready patterns over demo code

If something is out of scope for the first pass, structure the system so it can be added later cleanly.

Project Brief Summary

Use this summary as hard direction:

- Olive Linen is a premium Queenstown linen hire business
- The project is both a brand rebuild and an operations platform
- Public nav should include Home, Hire Linen / Book Now, Shop, Portfolio, Hospitality / Custom, About, Login, Cart
- Homepage should include hero, brand statement, featured products, portfolio preview, service tiles, testimonials, Instagram/social proof, and a premium footer
- Booking flow should go from dates to products to quantities to details to account to deposit to final balance
- Client portal should support booking management, payment visibility, timeline upload, messaging, documents, and order history
- Vendor portal should support approvals, discounts, repeat bookings, saved preferences, spend tracking, and messaging
- Hospitality / custom builder should support uploads, product options, quantity tiers, quote/payment logic, and admin status tracking
- Admin should include dashboard, calendar, bookings, inventory, products, pricing, finance, clients, vendors, wholesale/custom, enquiries, reports, and CMS editing
- Hosting target is Netlify
- Preferred backend foundation is Supabase or equivalent
- Preferred payments are Stripe
- Phase-based delivery is acceptable, but the architecture must be set up properly from the start

Definition of Success

The final product should feel beautiful enough to sell the brand and functional enough to sell the business.
