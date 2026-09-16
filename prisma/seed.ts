import "dotenv/config";
import { hashSync } from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../app/generated/prisma/client";

const url = new URL(
  process.env.DATABASE_URL ?? "mysql://root@localhost:3306/basket_latihan",
);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || "3306"),
  user: url.username || "root",
  password: url.password ? decodeURIComponent(url.password) : "",
  database: url.pathname.replace(/^\//, "") || "basket_latihan",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const PASSWORD = "rahasia123";
const passwordHash = hashSync(PASSWORD, 10);

const COACH_ID = "usr-coach-ardi";
const ASSISTANT_ID = "usr-asst-fajar";
const PARENT_ID = "usr-parent-sari";
const ATHLETE_RAKA = "usr-ath-raka";
const ATHLETE_BAGUS = "usr-ath-bagus";
const ATHLETE_DIMAS = "usr-ath-dimas";
const ATHLETE_ANDI = "usr-ath-andi";
const ATHLETE_FITRI = "usr-ath-fitri";

const TEAM_ID = "team-elang";

const DRILL_MIKAN = "drill-mikan";
const DRILL_FORM_SHOOT = "drill-form-shoot";
const DRILL_WEAVE = "drill-3man-weave";
const DRILL_BOXOUT = "drill-boxout";
const DRILL_BALL = "drill-ballhandling";
const DRILL_FT = "drill-ft";
const DRILL_DEFSLIDE = "drill-defslide";
const DRILL_SPRINT = "drill-sprint20";

const PROGRAM_ID = "prog-pra-musim";
const PROGRAM_GUARD = "prog-guard";
const PHASE_CAMP = "ph-camp";
const PHASE_SKILL = "ph-skill";
const PHASE_GAME = "ph-game";
const CYCLE_1 = "cy-1";
const CYCLE_2 = "cy-2";

const PACK_ID = "pack-baseline";

function at(offsetDays: number, hour = 16, minute = 0): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

const now = new Date();
const dayOfWeek = now.getDay();
const thisMonday = new Date(now);
thisMonday.setHours(0, 0, 0, 0);
thisMonday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
const lastMonday = new Date(thisMonday);
lastMonday.setDate(thisMonday.getDate() - 7);

async function main() {
  const deletes = [
    prisma.profileSession.deleteMany(),
    prisma.sessionComment.deleteMany(),
    prisma.sharedReport.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.drillResult.deleteMany(),
    prisma.sessionLog.deleteMany(),
    prisma.assessmentResultItem.deleteMany(),
    prisma.assessmentResult.deleteMany(),
    prisma.assessmentItem.deleteMany(),
    prisma.assessmentPack.deleteMany(),
    prisma.sessionDrill.deleteMany(),
    prisma.session.deleteMany(),
    prisma.programCycle.deleteMany(),
    prisma.programPhase.deleteMany(),
    prisma.programAssignment.deleteMany(),
    prisma.program.deleteMany(),
    prisma.drill.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.parentAthleteLink.deleteMany(),
    prisma.injury.deleteMany(),
    prisma.athleteReadiness.deleteMany(),
    prisma.profile.deleteMany(),
  ];
  await prisma.$transaction(deletes);

  await prisma.profile.createMany({
    data: [
      { id: COACH_ID, fullName: "Ardi Wijaya", role: "COACH", email: "coach@basket.app", phone: "081234567801", position: "Pelatih Utama", passwordHash },
      { id: ASSISTANT_ID, fullName: "Fajar Nugroho", role: "ASSISTANT", email: "asisten@basket.app", phone: "081234567802", position: "Asisten Pelatih", passwordHash },
      { id: PARENT_ID, fullName: "Sari Wulandari", role: "PARENT", email: "sari@basket.app", phone: "081234567803", passwordHash },
      { id: ATHLETE_RAKA, fullName: "Raka Pratama", role: "ATHLETE", email: "raka@basket.app", position: "Guard", heightCm: 178, weightKg: 68, dateOfBirth: new Date("2008-05-12T00:00:00Z"), isMinor: true, parentConsentStatus: "approved", passwordHash },
      { id: ATHLETE_BAGUS, fullName: "Bagus Santoso", role: "ATHLETE", email: "bagus@basket.app", position: "Guard", heightCm: 172, weightKg: 62, dateOfBirth: new Date("2008-09-03T00:00:00Z"), isMinor: true, parentConsentStatus: "approved", passwordHash },
      { id: ATHLETE_DIMAS, fullName: "Dimas Kurniawan", role: "ATHLETE", email: "dimas@basket.app", position: "Forward", heightCm: 186, weightKg: 76, dateOfBirth: new Date("2007-11-19T00:00:00Z"), isMinor: true, parentConsentStatus: "approved", passwordHash },
      { id: ATHLETE_ANDI, fullName: "Andi Wicaksono", role: "ATHLETE", email: "andi@basket.app", position: "Forward", heightCm: 184, weightKg: 74, dateOfBirth: new Date("2008-02-25T00:00:00Z"), isMinor: true, parentConsentStatus: "approved", passwordHash },
      { id: ATHLETE_FITRI, fullName: "Fitri Anjani", role: "ATHLETE", email: "fitri@basket.app", position: "Center", heightCm: 190, weightKg: 80, dateOfBirth: new Date("2007-08-30T00:00:00Z"), isMinor: true, parentConsentStatus: "approved", passwordHash },
    ],
  });

  await prisma.parentAthleteLink.create({
    data: {
      id: "link-raka-sari",
      parentId: PARENT_ID,
      athleteId: ATHLETE_RAKA,
      relationship: "ibu",
      status: "active",
    },
  });

  await prisma.team.create({
    data: {
      id: TEAM_ID,
      name: "Elang Muda U-15",
      coachId: COACH_ID,
      description: "Tim pembinaan basket usia 14–15 tahun.",
      seasonStart: thisMonday,
      seasonEnd: new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() + 210),
      members: {
        create: [
          { id: "tm-raka", athleteId: ATHLETE_RAKA, roleInTeam: "player", jerseyNumber: "7" },
          { id: "tm-bagus", athleteId: ATHLETE_BAGUS, roleInTeam: "player", jerseyNumber: "9" },
          { id: "tm-dimas", athleteId: ATHLETE_DIMAS, roleInTeam: "player", jerseyNumber: "11" },
          { id: "tm-andi", athleteId: ATHLETE_ANDI, roleInTeam: "player", jerseyNumber: "13" },
          { id: "tm-fitri", athleteId: ATHLETE_FITRI, roleInTeam: "player", jerseyNumber: "15" },
        ],
      },
    },
  });

  await prisma.drill.createMany({
    data: [
      { id: DRILL_MIKAN, ownerId: COACH_ID, name: "Mikan Drill", mainCategory: "Fundamental Individu", subCategory: "Finishing", difficulty: "pemula", relevantPositions: ["Semua"], targetType: "reps", defaultTargetValue: 20, description: "Finishing tangan kanan & kiri bergantian di bawah ring.", equipment: ["bola", "ring"], variations: ["Mikan dua tangan", "One-hand Mikan"] },
      { id: DRILL_FORM_SHOOT, ownerId: COACH_ID, name: "Form Shooting Radius 1–2 m", mainCategory: "Fundamental Individu", subCategory: "Shooting", difficulty: "pemula", relevantPositions: ["Semua"], targetType: "reps", defaultTargetValue: 25, description: "Tembakan form dengan fokus pergerakan BEEF (Balance, Eyes, Elbow, Follow-through).", equipment: ["bola", "ring"], variations: ["Fokus follow-through", "Satu tangan"] },
      { id: DRILL_WEAVE, ownerId: COACH_ID, name: "3-Man Weave", mainCategory: "Taktik & Tim", subCategory: "Fast Break / Transisi", difficulty: "menengah", relevantPositions: ["Semua"], targetType: "reps", defaultTargetValue: 6, description: "Pola serangan transisi 3 pemain dengan passing cepat.", equipment: ["bola", "cone", "ring"] },
      { id: DRILL_BOXOUT, ownerId: COACH_ID, name: "Box-Out Rebounding", mainCategory: "Taktik & Tim", subCategory: "Rebounding", difficulty: "menengah", relevantPositions: ["Forward", "Center"], targetType: "reps", defaultTargetValue: 12, description: "Blok lawan dan amankan rebound dengan teknik box-out.", equipment: ["bola", "ring"] },
      { id: DRILL_BALL, ownerId: COACH_ID, name: "Crossover & Behind-Back Dribble", mainCategory: "Fundamental Individu", subCategory: "Ball Handling", difficulty: "menengah", relevantPositions: ["Guard"], targetType: "time_sec", defaultTargetValue: 60, description: "Dribble kuasai bola dengan variasi crossover dan behind-back.", equipment: ["bola", "cone"], variations: ["Dua bola", "Satu bola"] },
      { id: DRILL_FT, ownerId: COACH_ID, name: "Free Throw Routine", mainCategory: "Fundamental Individu", subCategory: "Shooting", difficulty: "pemula", relevantPositions: ["Semua"], targetType: "percentage", defaultTargetValue: 70, description: "Rutinitas tembakan bebas dari garis 4,5 m.", equipment: ["bola", "ring"] },
      { id: DRILL_DEFSLIDE, ownerId: COACH_ID, name: "Defensive Slides", mainCategory: "Fisik & Atletis", subCategory: "Agility / Pertahanan", difficulty: "menengah", relevantPositions: ["Semua"], targetType: "reps", defaultTargetValue: 8, description: "Gerakan slide defensif kiri-kanan mengikuti arah cone.", equipment: ["cone"] },
      { id: DRILL_SPRINT, ownerId: COACH_ID, name: "Sprint 20 Meter", mainCategory: "Fisik & Atletis", subCategory: "Kecepatan", difficulty: "pemula", relevantPositions: ["Semua"], targetType: "time_sec", defaultTargetValue: 4.5, description: "Tes sprint 20 meter untuk mengukur kecepatan lari.", equipment: ["cone", "stopwatch"] },
    ],
  });

  await prisma.program.createMany({
    data: [
      {
        id: PROGRAM_ID,
        name: "Program Pra-Musim Elang Muda",
        type: "team",
        ownerId: COACH_ID,
        teamId: TEAM_ID,
        description: "Persiapan menuju musim kompetisi: fondasi fisik dan skill.",
        startDate: lastMonday,
        endDate: new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate() + 56),
        status: "active",
        isTemplate: false,
      },
      {
        id: PROGRAM_GUARD,
        name: "Progresi Guard (Raka)",
        type: "personal",
        ownerId: COACH_ID,
        description: "Program personal khusus posisi Guard: ball handling & pertahanan.",
        startDate: now,
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
        status: "active",
        isTemplate: false,
      },
    ],
  });

  await prisma.programAssignment.createMany({
    data: [
      { id: "pa-team", programId: PROGRAM_ID, athleteId: null, teamId: TEAM_ID, assignedAt: now },
      { id: "pa-raka", programId: PROGRAM_GUARD, athleteId: ATHLETE_RAKA, teamId: null, assignedAt: now },
    ],
  });

  await prisma.programPhase.createMany({
    data: [
      { id: PHASE_CAMP, programId: PROGRAM_ID, name: "Fondasi & Conditioning", orderIndex: 1, startDate: lastMonday, endDate: new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate() + 14), focusNotes: "Bangun dasar fisik dan otot." },
      { id: PHASE_SKILL, programId: PROGRAM_ID, name: "Pengembangan Skill Individu", orderIndex: 2, startDate: new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate() + 15), endDate: new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate() + 35), focusNotes: "Fokus shooting dan ball handling." },
      { id: PHASE_GAME, programId: PROGRAM_ID, name: "Penerapan & Gameplay", orderIndex: 3, startDate: new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate() + 36), endDate: null, focusNotes: "Terapkan ke skenario pertandingan." },
    ],
  });

  await prisma.programCycle.createMany({
    data: [
      { id: CYCLE_1, phaseId: PHASE_CAMP, name: "Minggu 1 — Aklimatisasi", weekNumber: 1, startDate: lastMonday, endDate: new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate() + 6) },
      { id: CYCLE_2, phaseId: PHASE_CAMP, name: "Minggu 2 — Penguatan", weekNumber: 2, startDate: thisMonday, endDate: new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() + 6) },
    ],
  });

  await prisma.session.createMany({
    data: [
      { id: "ses-p3", programId: PROGRAM_ID, cycleId: CYCLE_1, name: "Sesi Pekan Lalu: Dasar Tembakan", teamId: TEAM_ID, scheduledAt: at(-10, 10), durationMinutes: 90, location: "GOR Basket Buah Batu" },
      { id: "ses-p2", programId: PROGRAM_ID, cycleId: CYCLE_1, name: "Sesi Pekan Lalu: Rebound & Transisi", teamId: TEAM_ID, scheduledAt: at(-8, 16), durationMinutes: 90, location: "GOR Basket Buah Batu" },
      { id: "ses-p1", programId: PROGRAM_ID, cycleId: CYCLE_1, name: "Sesi Pekan Lalu: Conditioning & Agility", teamId: TEAM_ID, scheduledAt: at(-6, 16), durationMinutes: 75, location: "GOR Basket Buah Batu" },
      { id: "ses-hari1", programId: PROGRAM_ID, cycleId: CYCLE_2, name: "Sesi 1: Fondasi Tembakan & Ball Handling", teamId: TEAM_ID, scheduledAt: at(1, 16), durationMinutes: 90, location: "GOR Basket Buah Batu", notes: "Bawa sepatu outdoor & air minum." },
      { id: "ses-hari2", programId: PROGRAM_ID, cycleId: CYCLE_2, name: "Sesi 2: Transisi & Rebound", teamId: TEAM_ID, scheduledAt: at(3, 16), durationMinutes: 90, location: "GOR Basket Buah Batu" },
      { id: "ses-hari3", programId: PROGRAM_ID, cycleId: CYCLE_2, name: "Sesi 3: Pertahanan & Kondisi Fisik", teamId: TEAM_ID, scheduledAt: at(5, 10), durationMinutes: 75, location: "Lapangan Outdoor Ciwalk" },
      { id: "ses-personal-raka", programId: PROGRAM_GUARD, name: "Personal: Progresi Guard", athleteId: ATHLETE_RAKA, scheduledAt: at(2, 17, 30), durationMinutes: 60, location: "GOR Basket Buah Batu" },
    ],
  });

  await prisma.sessionDrill.createMany({
    data: [
      { id: "sd-p3-1", sessionId: "ses-p3", drillId: DRILL_FORM_SHOOT, orderIndex: 1, targetValue: 25, targetUnit: "reps", durationMinutes: 15 },
      { id: "sd-p3-2", sessionId: "ses-p3", drillId: DRILL_MIKAN, orderIndex: 2, targetValue: 20, targetUnit: "reps", durationMinutes: 12 },
      { id: "sd-p2-1", sessionId: "ses-p2", drillId: DRILL_WEAVE, orderIndex: 1, targetValue: 6, targetUnit: "reps", durationMinutes: 20 },
      { id: "sd-p2-2", sessionId: "ses-p2", drillId: DRILL_BOXOUT, orderIndex: 2, targetValue: 12, targetUnit: "reps", durationMinutes: 15 },
      { id: "sd-p1-1", sessionId: "ses-p1", drillId: DRILL_DEFSLIDE, orderIndex: 1, targetValue: 8, targetUnit: "reps", durationMinutes: 15 },
      { id: "sd-p1-2", sessionId: "ses-p1", drillId: DRILL_SPRINT, orderIndex: 2, targetValue: 4.5, targetUnit: "detik", durationMinutes: 10 },
      { id: "sd-p1-3", sessionId: "ses-p1", drillId: DRILL_FT, orderIndex: 3, targetValue: 70, targetUnit: "%", durationMinutes: 10 },
      { id: "sd-1-1", sessionId: "ses-hari1", drillId: DRILL_FORM_SHOOT, orderIndex: 1, targetValue: 30, targetUnit: "reps", durationMinutes: 20 },
      { id: "sd-1-2", sessionId: "ses-hari1", drillId: DRILL_BALL, orderIndex: 2, targetValue: 60, targetUnit: "detik", durationMinutes: 20 },
      { id: "sd-1-3", sessionId: "ses-hari1", drillId: DRILL_MIKAN, orderIndex: 3, targetValue: 20, targetUnit: "reps", durationMinutes: 15 },
      { id: "sd-2-1", sessionId: "ses-hari2", drillId: DRILL_WEAVE, orderIndex: 1, targetValue: 6, targetUnit: "reps", durationMinutes: 20 },
      { id: "sd-2-2", sessionId: "ses-hari2", drillId: DRILL_BOXOUT, orderIndex: 2, targetValue: 12, targetUnit: "reps", durationMinutes: 15 },
      { id: "sd-2-3", sessionId: "ses-hari2", drillId: DRILL_FT, orderIndex: 3, targetValue: 70, targetUnit: "%", durationMinutes: 12 },
      { id: "sd-3-1", sessionId: "ses-hari3", drillId: DRILL_DEFSLIDE, orderIndex: 1, targetValue: 8, targetUnit: "reps", durationMinutes: 15 },
      { id: "sd-3-2", sessionId: "ses-hari3", drillId: DRILL_SPRINT, orderIndex: 2, targetValue: 4.5, targetUnit: "detik", durationMinutes: 10 },
      { id: "sd-3-3", sessionId: "ses-hari3", drillId: DRILL_FT, orderIndex: 3, targetValue: 75, targetUnit: "%", durationMinutes: 12 },
      { id: "sd-pr-1", sessionId: "ses-personal-raka", drillId: DRILL_BALL, orderIndex: 1, targetValue: 90, targetUnit: "detik", durationMinutes: 25 },
      { id: "sd-pr-2", sessionId: "ses-personal-raka", drillId: DRILL_DEFSLIDE, orderIndex: 2, targetValue: 8, targetUnit: "reps", durationMinutes: 20 },
    ],
  });

  await prisma.sessionLog.createMany({
    data: [
      { id: "log-p3-raka", sessionId: "ses-p3", athleteId: ATHLETE_RAKA, attendanceStatus: "present", completed: true, rpe: 6, durationActualMinutes: 85, athleteNotes: "Form shooting makin konsisten.", loggedAt: at(-10, 11) },
      { id: "log-p3-bagus", sessionId: "ses-p3", athleteId: ATHLETE_BAGUS, attendanceStatus: "present", completed: true, rpe: 6, durationActualMinutes: 80, loggedAt: at(-10, 11) },
      { id: "log-p2-raka", sessionId: "ses-p2", athleteId: ATHLETE_RAKA, attendanceStatus: "present", completed: true, rpe: 7, durationActualMinutes: 90, loggedAt: at(-8, 17) },
      { id: "log-p2-bagus", sessionId: "ses-p2", athleteId: ATHLETE_BAGUS, attendanceStatus: "present", completed: true, rpe: 7, durationActualMinutes: 88, loggedAt: at(-8, 17) },
      { id: "log-p2-dimas", sessionId: "ses-p2", athleteId: ATHLETE_DIMAS, attendanceStatus: "present", completed: true, rpe: 8, durationActualMinutes: 90, coachNotes: "Kecepatan awal perlu dilatih lagi.", loggedAt: at(-8, 17) },
      { id: "log-p1-raka", sessionId: "ses-p1", athleteId: ATHLETE_RAKA, attendanceStatus: "present", completed: true, rpe: 8, durationActualMinutes: 75, loggedAt: at(-6, 17) },
      { id: "log-p1-bagus", sessionId: "ses-p1", athleteId: ATHLETE_BAGUS, attendanceStatus: "present", completed: true, rpe: 7, durationActualMinutes: 72, loggedAt: at(-6, 17) },
      { id: "log-p1-fitri", sessionId: "ses-p1", athleteId: ATHLETE_FITRI, attendanceStatus: "late", completed: true, rpe: 6, durationActualMinutes: 60, loggedAt: at(-6, 17) },
    ],
  });

  await prisma.drillResult.createMany({
    data: [
      { id: "dr-p3-raka-1", sessionLogId: "log-p3-raka", sessionDrillId: "sd-p3-1", actualValue: 78, unit: "reps", successCount: 19, attemptCount: 25 },
      { id: "dr-p3-raka-2", sessionLogId: "log-p3-raka", sessionDrillId: "sd-p3-2", actualValue: 16, unit: "reps" },
      { id: "dr-p3-bagus-1", sessionLogId: "log-p3-bagus", sessionDrillId: "sd-p3-1", actualValue: 74, unit: "reps", successCount: 18, attemptCount: 25 },
      { id: "dr-p3-bagus-2", sessionLogId: "log-p3-bagus", sessionDrillId: "sd-p3-2", actualValue: 18, unit: "reps" },
      { id: "dr-p2-raka-1", sessionLogId: "log-p2-raka", sessionDrillId: "sd-p2-1", actualValue: 5, unit: "reps" },
      { id: "dr-p2-raka-2", sessionLogId: "log-p2-raka", sessionDrillId: "sd-p2-2", actualValue: 11, unit: "reps" },
      { id: "dr-p2-bagus-1", sessionLogId: "log-p2-bagus", sessionDrillId: "sd-p2-1", actualValue: 5, unit: "reps" },
      { id: "dr-p2-bagus-2", sessionLogId: "log-p2-bagus", sessionDrillId: "sd-p2-2", actualValue: 10, unit: "reps" },
      { id: "dr-p2-dimas-1", sessionLogId: "log-p2-dimas", sessionDrillId: "sd-p2-1", actualValue: 4, unit: "reps" },
      { id: "dr-p2-dimas-2", sessionLogId: "log-p2-dimas", sessionDrillId: "sd-p2-2", actualValue: 12, unit: "reps" },
      { id: "dr-p1-raka-1", sessionLogId: "log-p1-raka", sessionDrillId: "sd-p1-1", actualValue: 7, unit: "reps" },
      { id: "dr-p1-raka-2", sessionLogId: "log-p1-raka", sessionDrillId: "sd-p1-2", actualValue: 3.9, unit: "detik" },
      { id: "dr-p1-raka-3", sessionLogId: "log-p1-raka", sessionDrillId: "sd-p1-3", actualValue: 70, unit: "%", successCount: 7, attemptCount: 10 },
      { id: "dr-p1-bagus-1", sessionLogId: "log-p1-bagus", sessionDrillId: "sd-p1-1", actualValue: 6, unit: "reps" },
      { id: "dr-p1-bagus-2", sessionLogId: "log-p1-bagus", sessionDrillId: "sd-p1-2", actualValue: 4.1, unit: "detik" },
      { id: "dr-p1-bagus-3", sessionLogId: "log-p1-bagus", sessionDrillId: "sd-p1-3", actualValue: 67, unit: "%", successCount: 6, attemptCount: 9 },
      { id: "dr-p1-fitri-1", sessionLogId: "log-p1-fitri", sessionDrillId: "sd-p1-1", actualValue: 8, unit: "reps" },
      { id: "dr-p1-fitri-2", sessionLogId: "log-p1-fitri", sessionDrillId: "sd-p1-2", actualValue: 4.3, unit: "detik" },
      { id: "dr-p1-fitri-3", sessionLogId: "log-p1-fitri", sessionDrillId: "sd-p1-3", actualValue: 75, unit: "%", successCount: 7, attemptCount: 9 },
    ],
  });

  await prisma.assessmentPack.create({
    data: {
      id: PACK_ID,
      ownerId: COACH_ID,
      name: "Asesmen Baseline Awal Musim",
      description: "Tolok ukur kondisi awal seluruh pemain Elang Muda.",
      items: {
        create: [
          { id: "assit-ft", drillId: DRILL_FT, orderIndex: 1, targetInstruction: "10 percobaan dari garis, hitung persentase." },
          { id: "assit-layup", drillId: DRILL_MIKAN, orderIndex: 2, targetInstruction: "Hitung jumlah layup berhasil dalam 30 detik." },
          { id: "assit-sprint", drillId: DRILL_SPRINT, orderIndex: 3, targetInstruction: "Dua percobaan, ambil waktu terbaik." },
          { id: "assit-defslide", drillId: DRILL_DEFSLIDE, orderIndex: 4, targetInstruction: "Latihan 30 detik, hitung jumlah slide." },
          { id: "assit-ball", drillId: DRILL_BALL, orderIndex: 5, targetInstruction: "Figure eight selama 60 detik." },
        ],
      },
    },
  });

  await prisma.assessmentResult.createMany({
    data: [
      { id: "res-baseline-raka", assessmentId: PACK_ID, athleteId: ATHLETE_RAKA, isBaseline: true, conductedBy: COACH_ID, conductedAt: at(-12, 14) },
      { id: "res-baseline-bagus", assessmentId: PACK_ID, athleteId: ATHLETE_BAGUS, isBaseline: true, conductedBy: COACH_ID, conductedAt: at(-12, 15) },
    ],
  });

  await prisma.assessmentResultItem.createMany({
    data: [
      { id: "ri-ft-raka", assessmentResultId: "res-baseline-raka", assessmentItemId: "assit-ft", actualValue: 65, unit: "%", notes: "Bagian akhir tembakan sudah rapi." },
      { id: "ri-layup-raka", assessmentResultId: "res-baseline-raka", assessmentItemId: "assit-layup", actualValue: 14, unit: "reps" },
      { id: "ri-sprint-raka", assessmentResultId: "res-baseline-raka", assessmentItemId: "assit-sprint", actualValue: 3.9, unit: "detik" },
      { id: "ri-defslide-raka", assessmentResultId: "res-baseline-raka", assessmentItemId: "assit-defslide", actualValue: 7, unit: "slide" },
      { id: "ri-ball-raka", assessmentResultId: "res-baseline-raka", assessmentItemId: "assit-ball", actualValue: 46, unit: "detik", notes: "Kecepatan bola perlu ditingkatkan." },
      { id: "ri-ft-bagus", assessmentResultId: "res-baseline-bagus", assessmentItemId: "assit-ft", actualValue: 60, unit: "%" },
      { id: "ri-layup-bagus", assessmentResultId: "res-baseline-bagus", assessmentItemId: "assit-layup", actualValue: 12, unit: "reps" },
      { id: "ri-sprint-bagus", assessmentResultId: "res-baseline-bagus", assessmentItemId: "assit-sprint", actualValue: 4.1, unit: "detik" },
      { id: "ri-defslide-bagus", assessmentResultId: "res-baseline-bagus", assessmentItemId: "assit-defslide", actualValue: 6, unit: "slide" },
      { id: "ri-ball-bagus", assessmentResultId: "res-baseline-bagus", assessmentItemId: "assit-ball", actualValue: 52, unit: "detik" },
    ],
  });

  await prisma.injury.create({
    data: {
      id: "inj-raka-ankle",
      athleteId: ATHLETE_RAKA,
      injuryType: "sprain",
      bodyPart: "pergelangan kaki kanan",
      severity: "ringan",
      startDate: at(-3),
      expectedRecoveryDate: at(4),
      status: "active",
      notes: "Terjadi saat pemanasan; gunakan es 3x sehari.",
      recordedBy: COACH_ID,
    },
  });

  await prisma.athleteReadiness.create({
    data: {
      id: "read-raka",
      athleteId: ATHLETE_RAKA,
      status: "limited",
      reason: "Ankle sprain — ikut latihan parsial tanpa kontak.",
      validFrom: now,
      validUntil: at(5),
      updatedBy: COACH_ID,
    },
  });

  await prisma.announcement.createMany({
    data: [
      { id: "ann-1", authorId: COACH_ID, teamId: TEAM_ID, title: "Jadwal latihan pekan ini", content: "Senin & Rabu di GOR Buah Batu 16.00, Sabtu pukul 10.00 di lapangan Ciwalk. Bawa sepatu dan air minum." },
      { id: "ann-raka", authorId: COACH_ID, athleteId: ATHLETE_RAKA, title: "Program personal Guard", content: "Dimulai Kamis 17.30 di GOR. Fokus ball handling dan pergerakan pertahanan." },
    ],
  });

  await prisma.sessionComment.create({
    data: {
      id: "sc-hari1",
      sessionId: "ses-hari1",
      authorId: COACH_ID,
      content: "Siapkan sepatu dan pastikan sarapan sebelum latihan.",
      createdAt: at(-1, 9),
    },
  });

  console.log(`Seeded: 8 profil, 1 tim (5 anggota), 8 drill, 2 program, 7 sesi, 2 asesmen baseline, 1 cedera, 2 pengumuman.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });