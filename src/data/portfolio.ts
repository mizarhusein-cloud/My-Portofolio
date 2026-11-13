/* =====================================================================
   PORTFOLIO CONTENT — edit this file to change the text on the site.

   Add a project: copy one { ... } block inside `projects` and edit it,
   and put its preview image in public/projects/.
   `details` and `gallery` fill the dialog that opens when the card is clicked.
   liveUrl: the LIVE website link only (e.g. https://xxx.vercel.app).
            Leave it "" when it isn't live yet — the card shows
            "Live demo soon". Never put GitHub links here.
   ===================================================================== */

export interface Project {
  title: string
  type: string
  year: string
  description: string
  tech: string[]
  liveUrl: string
  /** Preview image in /public/projects (screenshot of the site, 16:10 works best). */
  image: string
  /** Shown in the project detail dialog when a card is clicked. */
  details: ProjectDetails
  /** Screenshots for the dialog's gallery (1280×800 works best). The first is usually `image`. */
  gallery: { src: string; caption: string }[]
}

export interface ProjectDetails {
  /** My role, e.g. "Solo full-stack developer". */
  role: string
  /** Where the project comes from, e.g. "RevoU final project". */
  context: string
  /** Responsibilities & scope — what I owned. */
  scope: string[]
  /** Background: the problem and why the project exists. */
  background: string
  /** Method / strategy / solution — how I built it. */
  approach: string[]
  /** Result / output — what came out of it. */
  results: string[]
}

export interface Experience {
  role: string
  company: string
  location: string
  period: string
  points: string[]
  /** One line on how this job shows up in the way I build software. */
  inCode: string
}

export interface Education {
  school: string
  program: string
  period: string
  status: 'Completed' | 'In progress'
  text: string
}

export interface Tool {
  name: string
  /** Simple Icons slug, e.g. 'react' → siReact (see src/components/Stack.tsx). */
  icon: string
}

export const portfolio = {
  name: 'Franshin Mizar Husain',
  brand: 'Fraza',
  role: 'Frontend Developer',
  location: 'Based in Bali, Indonesia',

  hero: {
    lines: ['Crafting calm, fast', 'interfaces that feel alive.'],
    sub:
      "I'm a career-switcher turned Frontend Developer who turns ideas into fast, delightful " +
      'interfaces with React, Next.js and TypeScript — sharpened by AI-assisted workflows.',
  },

  about: {
    title: 'From career switcher to frontend builder.',
    lead:
      "I'm Franshin Mizar Husain, a frontend developer based in Bali, Indonesia. My path into " +
      "tech didn't start in a classroom — it started with curiosity. I made a bold " +
      'switch into software engineering, and every day since has been about learning, building ' +
      'and getting a little better than yesterday.',
    body:
      "Through RevoU I've built real, working products: responsive UIs, booking flows, admin " +
      'dashboards and REST APIs. I work AI-assisted — using AI as a pair-programmer to explore ' +
      "ideas, debug faster and understand the 'why' behind the code — while keeping quality, " +
      'security and the user experience front and centre.',
    highlights: [
      { title: 'Fresh perspective', text: 'Real-world thinking from a career switch, applied to every line of code.' },
      { title: 'Real projects', text: 'A beach club, a pet shop, browser games and a finance API — built end to end.' },
      { title: 'AI-assisted speed', text: 'Modern tooling plus AI to learn fast and ship clean work.' },
      { title: 'Ready to join', text: "Open to frontend roles — let's build something great together." },
    ],
  },

  projects: [
    {
      title: 'Saluna Beach Club',
      type: 'Full-stack website',
      year: '2026',
      description:
        'A beach club website with online reservations, a digital menu, customer accounts and a secure admin dashboard.',
      tech: ['Next.js', 'React', 'NestJS', 'PostgreSQL', 'JWT'],
      liveUrl: 'https://saluna-beach-club.vercel.app',
      image: '/projects/saluna.jpg',
      details: {
        role: 'Solo full-stack developer',
        context: 'RevoU final project',
        scope: [
          'Designed and built every page of the Next.js frontend, customer and admin side.',
          'Built the NestJS + Prisma REST API, the PostgreSQL schema and its migrations.',
          'Implemented login, roles and route protection on both frontend and backend.',
          'Deployed the stack: Vercel (web), Railway (API) and Supabase (database).',
        ],
        background:
          'A beach club runs on bookings and orders, but those usually come in through chat messages and paper notes — easy to lose and hard to track. ' +
          'Saluna needed one place where guests can see the venue, browse the menu, order and book a table, and where staff can follow everything as it happens.',
        approach: [
          'Split the product into two apps: a Next.js 15 frontend (App Router, TypeScript, Tailwind CSS) and a NestJS API with Prisma and PostgreSQL.',
          'Modelled the data in five related tables (users, reservations, orders, order items, menus) enforced with foreign keys.',
          'Two roles, Customer and Admin: JWT in an httpOnly cookie, pages guarded in middleware and every API call re-checked by the backend.',
          'The server prices each order from the menu itself, so prices sent by the browser are never trusted.',
          'Admin dashboard with live numbers and a notification bell that polls for new reservations and orders.',
        ],
        results: [
          'Live website with a digital menu and cart, accounts, table booking, "My reservations" and "My orders".',
          'Admin panel to manage reservations, orders (pending → preparing → served → completed), menu items and users.',
          'API documented with Swagger, covered by 61 end-to-end tests and a Postman collection with 103 assertions.',
        ],
      },
      gallery: [
        { src: '/projects/saluna.jpg', caption: 'Home page' },
        { src: '/projects/saluna/menu.jpg', caption: 'Digital menu with categories and cart' },
        { src: '/projects/saluna/reservation.jpg', caption: 'Table reservation (login required)' },
        { src: '/projects/saluna/admin-dashboard.jpg', caption: 'Admin dashboard with live numbers' },
        { src: '/projects/saluna/admin-orders.jpg', caption: 'Admin order management' },
        { src: '/projects/saluna/swagger.jpg', caption: 'API documentation (Swagger)' },
      ],
    },
    {
      title: 'Pawpaya Petshop',
      type: 'Pet shop website',
      year: '2026',
      description:
        'A pet shelter and pet shop site with a responsive product grid, category filters, dynamic product pages and an add-to-cart button.',
      tech: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript'],
      liveUrl: 'https://pawpaya.vercel.app',
      image: '/projects/pawpaya.jpg',
      details: {
        role: 'Solo frontend developer',
        context: 'RevoU milestone project',
        scope: [
          'Designed the visual style and layout of every page.',
          'Built the pages and reusable components with Next.js App Router and Tailwind CSS.',
          'Set up the product data, the category filter and dynamic product routes.',
          'Made the site responsive and deployed it on Vercel.',
        ],
        background:
          'Pet owners shopping online want to find the right product for their animal fast. Pawpaya is a pet shelter and pet shop ' +
          'concept for cats, dogs, guinea pigs and birds that needed a clean, friendly catalog that works just as well on a phone.',
        approach: [
          'Built on Next.js 16 (App Router) and React 19, styled with Tailwind CSS.',
          'Kept products in one typed data file, rendered by reusable ProductCard and ProductGrid components.',
          'Category filter (all, cats, dogs, guinea pigs, birds) that updates the grid instantly.',
          'Dynamic route /products/[id] generates a detail page for every product automatically.',
          'Used next/image for responsive, optimised images and next/link for instant navigation.',
        ],
        results: [
          'Live store with home, product catalog, product detail, promotion and FAQ pages.',
          'A layout that adapts to desktop, tablet and mobile.',
          'Adding a product only takes one new entry in the data file — its card and detail page appear by themselves.',
        ],
      },
      gallery: [
        { src: '/projects/pawpaya.jpg', caption: 'Home page' },
        { src: '/projects/pawpaya/products.jpg', caption: 'Product catalog with category filter' },
        { src: '/projects/pawpaya/detail.jpg', caption: 'Dynamic product detail page' },
        { src: '/projects/pawpaya/promotion.jpg', caption: 'Promotion page' },
        { src: '/projects/pawpaya/faq.jpg', caption: 'FAQ page' },
      ],
    },
    {
      title: 'Play With Me',
      type: 'Mini games landing page',
      year: '2026',
      description:
        'A playful landing page for three pixel-art browser games — Balloon Pop, Fly to Moon and Fruit Punch — each playable right in the browser.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      liveUrl: 'https://revou-fsse-feb26.github.io/milestone-2-mizarhusein-cloud-1/',
      image: '/projects/playwithme.jpg',
      details: {
        role: 'Solo developer & game designer',
        context: 'RevoU milestone project',
        scope: [
          'Designed the retro pixel-art look of the landing page and all three games.',
          'Wrote the game logic for each game in plain JavaScript — no frameworks or game engines.',
          'Built the landing page, including the contact form with validation.',
          'Published the site on GitHub Pages.',
        ],
        background:
          'The goal was to practise core web fundamentals — HTML, CSS and vanilla JavaScript — by building something people actually enjoy using. ' +
          'Play With Me bundles three small arcade games behind one landing page that works as a hub to launch them.',
        approach: [
          'A landing page with a video background, animated title, smooth scrolling and floating images.',
          'Each game has its own page and its own game loop, built with DOM manipulation and timers.',
          'Balloon Pop trains reflexes, Fly to Moon is an endless runner with a parallax background, Fruit Punch is a catch-the-fruit game.',
          'Scores and high scores, difficulty that ramps up, and simple, responsive controls (click, tap, space bar or mouse).',
          'A "Connect With Me" form with input validation and a confirmation pop-up.',
        ],
        results: [
          'Three playable games and a landing page, live on GitHub Pages.',
          'A consistent pixel-art identity using the Press Start 2P font.',
          'Solid practice in DOM events, animation timing and state handling without any library.',
        ],
      },
      gallery: [
        { src: '/projects/playwithme.jpg', caption: 'Landing page — game hub' },
        { src: '/projects/playwithme/fly-to-moon.jpg', caption: 'Fly to Moon — endless runner' },
        { src: '/projects/playwithme/fruit-punch.jpg', caption: 'Fruit Punch — catch the fruit' },
        { src: '/projects/playwithme/balloon-pop.jpg', caption: 'Balloon Pop — reflex game' },
        { src: '/projects/playwithme/connect.jpg', caption: '"Connect With Me" form' },
      ],
    },
    {
      title: 'Fintrack API',
      type: 'REST API · Backend',
      year: '2026',
      description:
        'Backend for a personal finance tracker: JWT auth, per-user ownership checks, role-based access, rate limiting and automatic balance recalculation.',
      tech: ['NestJS', 'PostgreSQL', 'Prisma', 'Docker'],
      liveUrl: '',
      image: '/projects/fintrack.svg',
      details: {
        role: 'Solo backend developer',
        context: 'RevoU milestone project',
        scope: [
          'Designed the normalised PostgreSQL schema and wrote the SQL schema, seed and example queries.',
          'Built the NestJS modules: auth, users, accounts, categories and transactions.',
          'Added authentication, ownership checks, roles and security hardening.',
          'Documented every endpoint in a Postman collection, including the blocked and error cases.',
        ],
        background:
          "A personal finance app is only useful if every user's money data stays private and the balances are always right. " +
          'Fintrack is the backend for a simple expense tracker: users connect cash, bank or e-wallet accounts, record transactions and tag them with income or expense categories.',
        approach: [
          'Started with a normalised schema of four tables (users, accounts, categories, transactions), then moved from mock data to Prisma and a real Postgres database.',
          "JWT login with bcrypt-hashed passwords; account and transaction routes check ownership — 403 for someone else's data, 404 when it doesn't exist.",
          'Role-based access: only admins can delete a shared category.',
          'A dedicated BalanceCalculatorService recalculates the account balance on every create, update and delete.',
          'Security layer: login rate limit (5 tries per minute), a CORS allow-list, helmet() headers and request-logging middleware.',
        ],
        results: [
          "A REST API covering auth, accounts, categories and transactions, with a relational endpoint that returns an account's transactions and their categories.",
          'A Postman collection that walks through every endpoint, including the 403 cases.',
          'SQL files with 9 example queries (joins, aggregation, subqueries and window functions) and a Dockerfile for deployment.',
        ],
      },
      gallery: [
        { src: '/projects/fintrack.svg', caption: 'Fintrack API overview' },
        { src: '/projects/fintrack/erd.jpg', caption: 'Database design (ERD)' },
        { src: '/projects/fintrack/endpoints.svg', caption: 'Endpoints and access rules' },
      ],
    },
  ] satisfies Project[],

  /** Tools in the scrolling logo ribbon. Add one by adding its icon in Stack.tsx too. */
  stack: [
    { name: 'React', icon: 'react' },
    { name: 'Next.js', icon: 'nextdotjs' },
    { name: 'TypeScript', icon: 'typescript' },
    { name: 'JavaScript', icon: 'javascript' },
    { name: 'Tailwind CSS', icon: 'tailwindcss' },
    { name: 'HTML', icon: 'html5' },
    { name: 'Node.js', icon: 'nodedotjs' },
    { name: 'NestJS', icon: 'nestjs' },
    { name: 'PostgreSQL', icon: 'postgresql' },
    { name: 'Postman', icon: 'postman' },
    { name: 'Swagger', icon: 'swagger' },
    { name: 'Railway', icon: 'railway' },
  ] satisfies Tool[],

  experience: [
    {
      role: 'Bank Teller',
      company: 'PT Bank Central Asia Tbk (BCA)',
      location: 'Indonesia',
      period: 'Mar 2022 — Mar 2025',
      points: [
        'Processed 100+ cash and non-cash transactions daily with high accuracy and strict data confidentiality.',
        'Served 50–200+ customers per day, resolving account issues and paperwork on the spot to avoid repeat visits.',
        'Balanced the cash drawer at the end of every shift for three years, supporting accurate branch reconciliation.',
        "Recommended BCA products matched to customer needs, supporting the branch's product and service targets.",
      ],
      inCode: 'Accuracy and data confidentiality — careful validation, secure auth and data I can trust.',
    },
    {
      role: 'Telephone Operator',
      company: 'The Retreat Palm Dubai MGallery by Sofitel',
      location: 'Dubai, UAE',
      period: 'Feb 2021 — Jun 2021',
      points: [
        'Handled 20–40 inbound calls per shift in English, routing each caller to the right resort department.',
        'Resolved guest requests and complaints by phone, keeping service smooth for international guests.',
        'Logged important calls and messages accurately so every follow-up reached the right team on time.',
        'Scheduled guest appointments and shared hotel service information, easing the front-desk workload.',
      ],
      inCode: 'Clear communication — readable UI copy and getting every user to the right place fast.',
    },
    {
      role: 'Food Server',
      company: 'AYANA Resort and Spa',
      location: 'Bali, Indonesia',
      period: 'Jan 2018 — Dec 2020',
      points: [
        "Served 20–100+ guests per shift at Dava Restaurant, adjusting service pace to the resort's occupancy levels.",
        'Coordinated orders with the kitchen team to deliver dishes on time during peak service hours.',
        'Resolved meal and service complaints on the spot, protecting the guest experience and resort reputation.',
        'Processed guest payments accurately at the end of each service, with every bill reconciled correctly.',
      ],
      inCode: 'Calm under peak pressure — teamwork, handoffs and shipping on time.',
    },
  ] satisfies Experience[],

  education: [
    {
      school: 'RevoU',
      program: 'Fullstack Software Engineering Bootcamp',
      period: 'Feb 2026 — Sep 2026',
      status: 'Completed',
      text:
        'An intensive program covering frontend and backend development with HTML, CSS, JavaScript, TypeScript, React, ' +
        'Next.js, Node.js, NestJS and PostgreSQL — including REST API design, database design and authentication. ' +
        'Built SALUNA and FinTrack API during the program and collaborated through Git and GitHub.',
    },
    {
      school: 'Universitas Terbuka',
      program: 'Bachelor of Management — Human Resources Management',
      period: 'Dec 2023 — Present',
      status: 'In progress',
      text:
        'Studying strategic management, services marketing, organizational behavior and statistics, which help me ' +
        'understand the business needs behind the software I build. Final article in progress: a systematic literature ' +
        'review on turnover intention among Generation Z employees in Indonesia.',
    },
  ] satisfies Education[],

  certificates: [
    { name: 'Fullstack Software Engineering', detail: 'RevoU, 2026' },
    { name: 'TOEFL', detail: 'Score 563' },
  ],

  languages: ['Indonesian — Native', 'English — Professional working proficiency'],

  contact: {
    title: "Let's build something together.",
    text:
      "I'm open to Frontend Developer opportunities. Whether you have a role, a project or just " +
      'want to say hi — my inbox is always open.',
    email: 'mizarhusein@gmail.com',
    linkedin: 'https://www.linkedin.com/in/franshin-mizar-h-aa4b73119',
  },
}
