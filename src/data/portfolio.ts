/* =====================================================================
   PORTFOLIO CONTENT — edit this file to change the text on the site.

   Add a project: copy one { ... } block inside `projects` and edit it,
   and put its preview image in public/projects/.
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
      "My path into tech didn't start in a classroom — it started with curiosity. I made a bold " +
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
    },
    {
      title: 'Pawpaya Petshop',
      type: 'Pet shop website',
      year: '2026',
      description:
        'A pet shelter and pet shop site with a responsive product grid, category filters, dynamic product pages and an add-to-cart flow.',
      tech: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript'],
      liveUrl: 'https://pawpaya.vercel.app',
      image: '/projects/pawpaya.jpg',
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
