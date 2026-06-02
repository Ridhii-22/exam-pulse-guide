export const subjects = [
  { id: "physics", name: "Physics", color: "var(--color-info)", chapters: 29 },
  { id: "chemistry", name: "Chemistry", color: "var(--color-warning)", chapters: 30 },
  { id: "biology", name: "Biology", color: "var(--color-success)", chapters: 38 },
];

export const subjectProgress = [
  { subject: "Physics", solved: 1240, total: 2800, accuracy: 68 },
  { subject: "Chemistry", solved: 1820, total: 3000, accuracy: 74 },
  { subject: "Biology", solved: 2410, total: 3600, accuracy: 81 },
];

export const recentTests = [
  { id: "1", title: "Thermodynamics — Chapter Test", score: 78, total: 100, date: "Today" },
  { id: "2", title: "Organic Chemistry PYQ 2023", score: 64, total: 90, date: "Yesterday" },
  { id: "3", title: "Human Physiology Mock", score: 142, total: 180, date: "2d ago" },
];

export const weakChapters = [
  { name: "Rotational Motion", subject: "Physics", accuracy: 42 },
  { name: "Coordination Compounds", subject: "Chemistry", accuracy: 48 },
  { name: "Plant Physiology", subject: "Biology", accuracy: 53 },
];

export const dailyGoals = [
  { label: "Solve 50 questions", progress: 34, total: 50 },
  { label: "Watch 2 lectures", progress: 1, total: 2 },
  { label: "Revise 1 chapter", progress: 1, total: 1 },
];

export const chapters: Record<string, string[]> = {
  physics: [
    "Kinematics",
    "Laws of Motion",
    "Work, Energy & Power",
    "Rotational Motion",
    "Thermodynamics",
    "Oscillations",
    "Waves",
    "Electrostatics",
    "Current Electricity",
    "Magnetism",
    "EMI & AC",
    "Optics",
    "Modern Physics",
  ],
  chemistry: [
    "Atomic Structure",
    "Chemical Bonding",
    "Thermodynamics",
    "Equilibrium",
    "Redox Reactions",
    "Hydrocarbons",
    "Haloalkanes",
    "Alcohols & Phenols",
    "Aldehydes & Ketones",
    "Amines",
    "Biomolecules",
    "Coordination Compounds",
    "p-Block Elements",
  ],
  biology: [
    "Cell Structure",
    "Biomolecules",
    "Cell Cycle",
    "Plant Physiology",
    "Human Physiology",
    "Reproduction",
    "Genetics",
    "Evolution",
    "Human Health",
    "Biotechnology",
    "Ecology",
    "Biodiversity",
  ],
};

export const lectures = [
  {
    id: "l1",
    subject: "Physics",
    chapter: "Thermodynamics",
    title: "First Law & Internal Energy",
    duration: "42:18",
    progress: 100,
  },
  {
    id: "l2",
    subject: "Physics",
    chapter: "Thermodynamics",
    title: "Heat Engines & Carnot Cycle",
    duration: "38:02",
    progress: 65,
  },
  {
    id: "l3",
    subject: "Chemistry",
    chapter: "Coordination Compounds",
    title: "Werner's Theory & IUPAC Nomenclature",
    duration: "51:30",
    progress: 30,
  },
  {
    id: "l4",
    subject: "Biology",
    chapter: "Genetics",
    title: "Mendel's Laws & Inheritance",
    duration: "47:12",
    progress: 0,
  },
];

export const papers = [
  { id: "p1", title: "NEET 2024 Official Paper", type: "Previous Year", year: 2024, pages: 48 },
  { id: "p2", title: "NEET 2023 Official Paper", type: "Previous Year", year: 2023, pages: 46 },
  { id: "p3", title: "Allen Major Test 04", type: "Coaching", year: 2024, pages: 32 },
  { id: "p4", title: "Aakash AIATS 12", type: "Coaching", year: 2024, pages: 36 },
  { id: "p5", title: "Full Length Mock 07", type: "Mock", year: 2025, pages: 40 },
  { id: "p6", title: "NCERT Sample Paper Biology", type: "Sample", year: 2025, pages: 24 },
];

export const activity = [
  { day: "Mon", value: 3 },
  { day: "Tue", value: 5 },
  { day: "Wed", value: 2 },
  { day: "Thu", value: 4 },
  { day: "Fri", value: 6 },
  { day: "Sat", value: 5 },
  { day: "Sun", value: 4 },
];

export const badges = [
  { name: "7-Day Streak", desc: "Studied every day this week", earned: true },
  { name: "Mock Master", desc: "Completed 10 full mock tests", earned: true },
  { name: "Biology Pro", desc: "85%+ accuracy in Biology", earned: true },
  { name: "Marathon", desc: "Solve 500 questions in a week", earned: false },
];
