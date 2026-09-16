export const CATEGORIES = [
  "Fundamental Individu",
  "Fisik & Atletis",
  "Taktik & Tim",
  "Mental & Game IQ",
] as const;

export const SUBCATEGORIES: Record<string, readonly string[]> = {
  "Fundamental Individu": [
    "Ball Handling",
    "Shooting",
    "Finishing",
    "Passing",
    "Footwork",
    "Free Throw",
  ],
  "Fisik & Atletis": [
    "Kecepatan",
    "Agility / Pertahanan",
    "Kekuatan",
    "Endurance",
    "Pemanasan",
  ],
  "Taktik & Tim": [
    "Fast Break / Transisi",
    "Rebounding",
    "Set Play",
    "Pressing",
    "Off-Ball Movement",
  ],
  "Mental & Game IQ": ["Basketball IQ", "Leadership", "Fokus & Konsentrasi"],
} as const;

export const DIFFICULTIES = ["pemula", "menengah", "lanjut"] as const;

export const TARGET_TYPES = [
  { value: "reps", label: "Repetisi" },
  { value: "time_sec", label: "Waktu (detik)" },
  { value: "percentage", label: "Persentase (%)" },
  { value: "distance_m", label: "Jarak (meter)" },
] as const;

export const POSITIONS = ["Semua", "Guard", "Forward", "Center"] as const;

export const EQUIPMENT_OPTIONS = [
  "bola",
  "ring",
  "cone",
  "stopwatch",
  "papan pantul",
  "resistance band",
  "parachute",
  "ramp",
  "timer",
  "barrier",
] as const;

export type DrillState = {
  error?: string;
};

export type DrillInput = {
  id: string;
  name: string;
  mainCategory: string;
  subCategory: string;
  difficulty: string;
  targetType: string;
  defaultTargetValue: number | null;
  description: string | null;
  videoUrl: string | null;
  relevantPositions: string[];
  equipment: string[];
  variations: string[];
  isPublicTemplate: boolean;
};

export const TARGET_LABEL: Record<string, (v: number | null) => string> = {
  reps: (v) => (v === null ? "—" : `${v} reps`),
  time_sec: (v) => (v === null ? "—" : `${v} detik`),
  percentage: (v) => (v === null ? "—" : `${v}%`),
  distance_m: (v) => (v === null ? "—" : `${v} m`),
};

export const DIFF_META: Record<
  string,
  { label: string; variant: "primary" | "success" | "warning" | "danger" | "neutral" }
> = {
  pemula: { label: "Pemula", variant: "success" },
  menengah: { label: "Menengah", variant: "warning" },
  lanjut: { label: "Lanjut", variant: "danger" },
};

export function drillToInput(d: {
  id: string;
  name: string;
  mainCategory: string;
  subCategory: string;
  difficulty: string;
  targetType: string;
  defaultTargetValue: number | null;
  description: string | null;
  videoUrl: string | null;
  relevantPositions: unknown;
  equipment: unknown;
  variations: unknown;
  isPublicTemplate: boolean;
}): DrillInput {
  return {
    id: d.id,
    name: d.name,
    mainCategory: d.mainCategory,
    subCategory: d.subCategory,
    difficulty: d.difficulty,
    targetType: d.targetType,
    defaultTargetValue: d.defaultTargetValue,
    description: d.description,
    videoUrl: d.videoUrl,
    relevantPositions: Array.isArray(d.relevantPositions)
      ? d.relevantPositions.map(String)
      : [],
    equipment: Array.isArray(d.equipment) ? d.equipment.map(String) : [],
    variations: Array.isArray(d.variations) ? d.variations.map(String) : [],
    isPublicTemplate: d.isPublicTemplate,
  };
}