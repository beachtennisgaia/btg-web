import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter } as never);

const TOURNAMENT_ID = "cmqwa273v000004jsb6ldcm0y";

const MALE_PLAYERS = [
  { name: "João Ferreira",   email: "joao.ferreira@test.btg",   level: "INTERMEDIATE" },
  { name: "Pedro Santos",    email: "pedro.santos@test.btg",     level: "BEGINNER" },
  { name: "Miguel Costa",    email: "miguel.costa@test.btg",     level: "ADVANCED" },
  { name: "Tiago Oliveira",  email: "tiago.oliveira@test.btg",   level: "INTERMEDIATE" },
  { name: "Rui Mendes",      email: "rui.mendes@test.btg",       level: "BEGINNER" },
  { name: "Carlos Silva",    email: "carlos.silva@test.btg",     level: "ADVANCED" },
  { name: "Luís Rodrigues",  email: "luis.rodrigues@test.btg",   level: "INTERMEDIATE" },
  { name: "Nuno Martins",    email: "nuno.martins@test.btg",     level: "BEGINNER" },
  { name: "André Carvalho",  email: "andre.carvalho@test.btg",   level: "ADVANCED" },
  { name: "Bruno Alves",     email: "bruno.alves@test.btg",      level: "INTERMEDIATE" },
];

const FEMALE_PLAYERS = [
  { name: "Ana Pereira",     email: "ana.pereira@test.btg",      level: "INTERMEDIATE" },
  { name: "Sofia Gomes",     email: "sofia.gomes@test.btg",      level: "ADVANCED" },
  { name: "Mariana Lopes",   email: "mariana.lopes@test.btg",    level: "BEGINNER" },
  { name: "Beatriz Sousa",   email: "beatriz.sousa@test.btg",    level: "INTERMEDIATE" },
  { name: "Inês Fonseca",    email: "ines.fonseca@test.btg",     level: "BEGINNER" },
  { name: "Catarina Cunha",  email: "catarina.cunha@test.btg",   level: "ADVANCED" },
  { name: "Rita Fernandes",  email: "rita.fernandes@test.btg",   level: "INTERMEDIATE" },
  { name: "Marta Ribeiro",   email: "marta.ribeiro@test.btg",    level: "BEGINNER" },
  { name: "Diana Pinto",     email: "diana.pinto@test.btg",      level: "ADVANCED" },
  { name: "Patrícia Lima",   email: "patricia.lima@test.btg",    level: "INTERMEDIATE" },
];

async function main() {
  // 1. Delete all matches for this tournament
  const deletedMatches = await db.match.deleteMany({ where: { tournamentId: TOURNAMENT_ID } });
  console.log("Deleted matches:", deletedMatches.count);

  // 2. Delete all registrations for this tournament
  const deletedRegs = await db.registration.deleteMany({ where: { tournamentId: TOURNAMENT_ID } });
  console.log("Deleted registrations:", deletedRegs.count);

  // 3. Delete all fake members (clerkId starts with "fake_")
  const fakeMembers = await db.member.findMany({
    where: { clerkId: { startsWith: "fake_" } },
    select: { id: true },
  });
  // Delete any remaining registrations from fake members in other tournaments
  await db.registration.deleteMany({ where: { player1Id: { in: fakeMembers.map(m => m.id) } } });
  await db.registration.deleteMany({ where: { player2Id: { in: fakeMembers.map(m => m.id) } } });
  const deletedMembers = await db.member.deleteMany({ where: { clerkId: { startsWith: "fake_" } } });
  console.log("Deleted fake members:", deletedMembers.count);

  // 4. Find real members (André and Andressa)
  const realMembers = await db.member.findMany({
    where: { clerkId: { not: { startsWith: "fake_" } } },
    select: { id: true, name: true, gender: true },
  });
  const andre = realMembers.find(m => m.name.includes("Andre") || m.name.includes("André"));
  const andressa = realMembers.find(m => m.name.includes("Andressa"));
  if (!andre || !andressa) throw new Error("André ou Andressa não encontrados");
  console.log("Real members found:", andre.name, andressa.name);

  // 5. Create 10 male + 10 female fake members
  const allPlayers = [
    ...MALE_PLAYERS.map(p => ({ ...p, gender: "MALE" as const })),
    ...FEMALE_PLAYERS.map(p => ({ ...p, gender: "FEMALE" as const })),
  ];

  const createdMembers = [];
  for (const p of allPlayers) {
    const member = await db.member.upsert({
      where: { email: p.email },
      create: {
        clerkId: `fake_${p.email}`,
        name: p.name,
        email: p.email,
        gender: p.gender,
        level: p.level as never,
        profileComplete: true,
      },
      update: { gender: p.gender, level: p.level as never, profileComplete: true },
    });
    createdMembers.push({ ...member, gender: p.gender });
  }
  console.log("Created/upserted fake members:", createdMembers.length);

  // 6. Register all players individually (André + 10 males + Andressa + 10 females) — CONFIRMED
  const males = [
    { id: andre.id, gender: "MALE" },
    ...createdMembers.filter(m => m.gender === "MALE").map(m => ({ id: m.id, gender: "MALE" })),
  ];
  const females = [
    { id: andressa.id, gender: "FEMALE" },
    ...createdMembers.filter(m => m.gender === "FEMALE").map(m => ({ id: m.id, gender: "FEMALE" })),
  ];

  const allToRegister = [...males, ...females];
  for (const player of allToRegister) {
    await db.registration.create({
      data: {
        tournamentId: TOURNAMENT_ID,
        player1Id: player.id,
        status: "CONFIRMED",
      },
    });
  }
  console.log("Created registrations:", allToRegister.length);
  console.log("  Males:", males.length, "(André + 10)");
  console.log("  Females:", females.length, "(Andressa + 10)");
  console.log("Done!");
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1); });
