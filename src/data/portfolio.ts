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

export interface Skill {
  name: string
  tag: string
  text: string
}

export const portfolio = {
  name: 'Franshin Mizar Husain',
  brand: 'Fraza',
  role: 'Frontend Developer',
  location: 'Based in Indonesia',

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
      { title: 'Real projects', text: 'A beach club, a pet shop and a finance API — built end to end.' },
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
      tech: ['Next.js', 'NestJS', 'TypeScript'],
      liveUrl: 'https://saluna-beach-club.vercel.app',
      image: '/projects/saluna.jpg',
    },
    {
      title: 'Pawpaya Petshop',
      type: 'Pet shop website',
      year: '2026',
      description: 'A cheerful online pet shop experience for browsing products and services for furry friends.',
      tech: ['React', 'TypeScript'],
      liveUrl: '',
      image: '/projects/pawpaya.svg',
    },
    {
      title: 'Fintrack API',
      type: 'REST API',
      year: '2026',
      description: 'A backend API for tracking personal finances — income, expenses and balances, kept tidy and secure.',
      tech: ['NestJS', 'TypeScript'],
      liveUrl: '',
      image: '/projects/fintrack.svg',
    },
  ] satisfies Project[],

  skills: [
    { name: 'React', tag: 'UI library', text: 'Reusable, interactive components that keep interfaces clean and easy to grow.' },
    { name: 'Next.js', tag: 'Framework', text: 'Fast, SEO-friendly apps with routing, server rendering and smooth deploys.' },
    { name: 'TypeScript', tag: 'Language', text: 'Safer, self-documenting code that catches bugs before users ever see them.' },
    { name: 'JavaScript', tag: 'Language', text: 'The foundation of everything I build — from DOM work to modern async logic.' },
    { name: 'Three.js', tag: '3D on the web', text: 'Interactive 3D scenes — like the koi pond at the top of this page.' },
    { name: 'NestJS', tag: 'Backend', text: 'Structured REST APIs so my frontends always have solid data to stand on.' },
  ] satisfies Skill[],

  contact: {
    title: "Let's build something together.",
    text:
      "I'm open to Frontend Developer opportunities. Whether you have a role, a project or just " +
      'want to say hi — my inbox is always open.',
    email: 'mizarhusein@gmail.com',
    linkedin: 'https://www.linkedin.com/in/franshin-mizar-h-aa4b73119',
  },
}
