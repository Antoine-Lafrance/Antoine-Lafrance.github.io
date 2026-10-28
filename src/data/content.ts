// All site copy lives here. Edit this file to change what the home page says.
// Lines marked TODO still need input from Antoine.
import type { ImageMetadata } from 'astro';
import milaImg from '../assets/slides/mila.avif';
import chumImg from '../assets/slides/CHUM.jpg';
import polyImg from '../assets/slides/poly.png';
import msOfficeImg from '../assets/slides/morgan_stanely_internship.jpeg';
import gradImg from '../assets/slides/grad.jpeg';
import innodataImg from '../assets/slides/innodata.jpg';

export const profile = {
  name: 'Antoine Lafrance',
  role: 'M.Sc. student in Computer Engineering',
  affiliations: ['Mila – Quebec AI Institute', 'Polytechnique Montréal', 'Chandar Lab'],
  intro:
    'I’m a master’s student at Mila – Quebec AI Institute and Polytechnique Montréal, ' +
    'working in the Chandar Lab under the supervision of Prof. Sarath Chandar. ' +
    'My research sits where machine learning meets health and biology: I care about ' +
    'models that are reliable and interpretable enough to inform real decisions.',
  now: 'Bayesian optimisers for foundation models in biology',
  email: 'antoine.lafrance@mila.quebec',
  links: [
    { label: 'GitHub', href: 'https://github.com/antoine-lafrance' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/antoine-lafrance' },
    // TODO: add Google Scholar / OpenReview when available.
  ],
  // TODO: put an English CV at public/cv.pdf (without the phone number).
  cv: '/cv.pdf',
};

export const orgLinks = {
  mila: 'https://mila.quebec',
  chandarLab: 'https://chandar-lab.github.io',
  sarath: 'https://sarathchandar.in',
  poly: 'https://www.polymtl.ca',
};

export const currentWork = {
  title: 'Bayesian optimisers for foundation models in biology',
  meta: ['Chandar Lab', 'Mila', 'Sept 2026 — present'],
  // M.Sc. dates; the progress bar fills between these in real time.
  start: '2026-09-01T00:00:00-04:00',
  end: '2028-04-30T23:59:59-04:00',
};

export const researchPath =
  'I started doing research on my own initiative during my bachelor’s: an optional ' +
  'project, not a required internship, on kidney transplant allocation at Polytechnique ' +
  'Montréal, supervised by Prof. Jonathan Jalbert. Working at the intersection of ' +
  'programming, statistical modelling and health taught me how much transparency, ' +
  'reliability and interpretability matter for tools that can inform clinical decisions. ' +
  'That work led to the two manuscripts in the Manuscripts folder, and it continues at Mila.';

// TODO: adjust if these don't match how you'd describe your interests.
export const interests = [
  'Optimization for large models',
  'Bayesian methods',
  'ML for health & biology',
  'Survival analysis & simulation',
];

export type Paper = {
  id: string;
  /** short name shown in the Research file tree */
  file: string;
  title: string;
  authors: string[];
  status: string;
  year: number;
  summary: string;
  contribution: string;
  links: { label: string; href: string }[];
};

export const papers: Paper[] = [
  {
    id: '01',
    file: 'Survival forests.pdf',
    title:
      'Improving random survival forest models generating individualized kidney graft and patient survival curves using external and local cohorts',
    authors: [
      'Qi, Y.', 'Jalbert, J.', 'Boivin, P. L.', 'Bouchkari, R.', 'Colette, S.', 'Lafrance, A.',
      'Lajnef, T.', 'Basanets, A. O.', 'Sapir-Pichhadze, R.', 'Senecal, L.', 'Thériault, L.',
      'Cardinal, H.',
    ],
    status: 'In preparation',
    year: 2026,
    summary:
      'Random survival forests trained on a large US cohort (161,749 transplant recipients) ' +
      'are evaluated on 799 patients from two Canadian transplant centres. We compare using ' +
      'the US models as-is, training Canadian-only models, and combining trees from both ' +
      'populations, and test augmenting the local data with similar external patients or ' +
      'synthetic data.',
    contribution:
      'I designed a web interface that lets patients explore their own predicted survival ' +
      'curves, making the model’s results understandable to non-specialists.',
    links: [],
  },
  {
    id: '02',
    file: 'Waiting time.pdf',
    title: 'Predicting waiting time of patients waiting for a renal transplant',
    authors: ['Basanets, A. O.', 'Lafrance, A.', 'Jalbert, J.', 'Thériault, L.', 'Cardinal, H.'],
    status: 'In preparation',
    year: 2026,
    summary:
      'Predicts how long patients on Québec’s kidney transplant waiting list will wait, by ' +
      'simulating the allocation process to study how patient characteristics and allocation ' +
      'rules affect time to transplant.',
    contribution:
      'I built the Julia library that reproduces allocation scenarios with resampling ' +
      '(bootstrapping) and proposed methods for evaluating and comparing simulation results, ' +
      'including a composite score for comparing allocation systems worldwide. I also built ' +
      'a GUI for exploring results and presented it to Transplant-Québec’s kidney-pancreas council.',
    links: [],
  },
];

export const tracks = [
  {
    title: 'Machine Learning Intern',
    org: 'Innodata',
    start: '2022.07',
    end: '2022.09',
    note: 'Applied methods from NLP research to Kaggle problems and communicated results to non-technical stakeholders.',
  },
  {
    title: 'B.Eng. Software Engineering',
    org: 'Polytechnique Montréal',
    start: '2022.09',
    end: '2026.04',
    note: 'GPA 3.97.',
  },
  {
    title: 'Software Engineering Intern',
    org: 'Morgan Stanley',
    start: '2024.05',
    end: '2024.08',
    note: 'Built an interactive yield-curve comparison tool for analysts with Angular and Spring Boot.',
  },
  {
    title: 'Lab Instructor, MTH3302 & LOG1810',
    org: 'Polytechnique Montréal',
    start: '2025.01',
    end: '2026.04',
    note: 'Weekly sessions on logic, number theory and CS fundamentals; coaching rigorous problem-solving.',
  },
  {
    title: 'Research Assistant, kidney transplantation',
    org: 'Polytechnique Montréal',
    start: '2025.05',
    end: '2026.08',
    note: 'Self-initiated, supervised by Prof. Jonathan Jalbert. Julia allocation simulator, results GUI presented to Transplant-Québec, composite score for comparing allocation systems.',
  },
  {
    title: 'M.Sc. Computer Engineering',
    org: 'Mila / Polytechnique Montréal',
    start: '2026.09',
    end: '2028.04',
    note: 'Supervised by Prof. Sarath Chandar. Chandar Lab.',
  },
];

// Media player slideshow, oldest first, in the order the photos were taken.
// `track` is the index in `tracks` above; `caption` is the subtitle shown
// under the picture.
export type Slide = { track: number; image: ImageMetadata; alt: string; caption: string };

export const slides: Slide[] = [
  {
    track: 0,
    image: innodataImg,
    alt: 'Innodata logo on a phone screen',
    caption: 'Innodata, summer 2022. My first ML internship, applying NLP research to real problems.',
  },
  {
    track: 2,
    image: msOfficeImg,
    alt: 'Morgan Stanley office building',
    caption: 'Morgan Stanley, summer 2024. I built a yield-curve comparison tool for analysts.',
  },
  {
    track: 3,
    image: polyImg,
    alt: 'Atrium of Polytechnique Montréal with escalators and a metro car',
    caption: 'Polytechnique Montréal. Every week I led labs on logic, number theory and CS fundamentals.',
  },
  {
    track: 4,
    image: chumImg,
    alt: 'Main entrance of the CHUM hospital in Montréal',
    caption: 'CHUM, Montréal. As a research assistant, I simulated kidney transplant allocation for Québec patients.',
  },
  {
    track: 1,
    image: gradImg,
    alt: 'Antoine in graduation gown holding a Polytechnique Montréal diploma',
    caption: 'Graduation! B.Eng. in Software Engineering from Polytechnique Montréal, GPA 3.97.',
  },
  {
    track: 5,
    image: milaImg,
    alt: 'The Mila building in Montréal',
    caption: 'Mila – Quebec AI Institute. My M.Sc. home, in the Chandar Lab with Prof. Sarath Chandar.',
  },
];

// Shown as Awards.txt in Notepad. Competition results (Winner/Podium) are
// added below these automatically from `competitions`.
export const awards = [
  {
    group: 'Scholarships',
    items: [
      'NSERC Undergraduate Student Research Award (+ supplement)',
      'CAE R.-Fraser-Elliott Excellence Scholarship',
    ],
  },
  {
    group: 'Academic',
    items: ['GPA 3.97, B.Eng. Software Engineering, Polytechnique Montréal'],
  },
];

export type Card = {
  title: string;
  tag?: string;
  date: string;
  text: string;
  pin?: string;
  /** optional link to the project, shown on its card and in Awards.txt */
  link?: { label: string; href: string };
  /** optional description shown under it in Awards.txt */
  awardNote?: string;
};

export const competitions: Card[] = [
  {
    title: 'HackMIT',
    date: 'Sept 2025',
    text: 'Smart glasses to support people with dementia, powered by our own retrieval-augmented generation (RAG) system. Received a travel grant to attend.',
    pin: 'Cambridge, MA',
  },
  {
    title: 'McKinsey Challenge',
    tag: 'Winner',
    date: 'Apr 2024',
    text: 'Proposed solutions for a local non-profit that were later implemented.',
  },
  {
    title: 'PolyAI CodeML',
    tag: 'Winner',
    date: '2022 — 2024, 2026',
    text:
      'Models for quantum computing and biology; flood prediction from real-time precipitation and topography data. ' +
      'In 2026 I took part again and won with a tool that scans recycled lenses and 3D-prints custom frames for them: ' +
      'it was used in Mali to make over 1,000 pairs of glasses for children in need, with Santé numérique sans frontières.',
    link: { label: 'See the 2026 glasses tool', href: 'https://glasses-eta.vercel.app/' },
    awardNote:
      'In 2026 I took part again and won with a tool that scans recycled lenses and 3D-prints custom frames for them: ' +
      'it was used in Mali to make over 1,000 pairs of glasses for children in need, with Santé numérique sans frontières.',
  },
  {
    title: 'Polyfinances Datathon',
    tag: 'Podium',
    date: '2023 — 2024',
    text: 'ML-based quantitative trading algorithm; AI assistant for financial analysts built on AWS microservices and agents.',
  },
  {
    title: 'IBM Pro Bono',
    tag: 'Podium',
    date: 'Fall 2023',
    text: 'Advised a 50+ employee non-profit; assessed and improved its processes through field work.',
  },
];

export const leadership: Card[] = [
  {
    title: 'PolyMonde',
    tag: 'VP Financing',
    date: 'Sept 2025 — 2027',
    text: 'Polytechnique’s oldest student committee. As VP Financing, I have raised over $100,000 CAD through corporate partnerships to fund the committee’s initiatives, and visited 80+ companies with research focuses ranging from AI to critical minerals, across three countries.',
  },
  {
    title: 'CCGP',
    tag: 'VP Competitions',
    date: '2023 — 2024',
    text: 'Polytechnique’s management consulting club. Organized a tech-focused case competition with a pension fund manager ($3,000 in prizes); took part in Grow@BCG.',
  },
];

// TODO: a short personal paragraph (hobbies, interests) in your own words.
export const personal = '';

// One window per section. `label` is the short taskbar name.
export const sections = [
  { id: 'intro', label: 'About Me', icon: 'user' },
  { id: 'now', label: 'Current Work', icon: 'progress' },
  { id: 'research', label: 'Research', icon: 'folder' },
  { id: 'tracks', label: 'Experience', icon: 'cone' },
  { id: 'awards', label: 'Awards', icon: 'medal' },
  { id: 'beyond', label: 'Beyond Research', icon: 'people' },
  { id: 'contact', label: 'Contact', icon: 'mail' },
] as const;
