import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter } as never);

const TOURNAMENT_ID = "cmqwa273v000004jsb6ldcm0y";

// Inscrições em dupla (pré-formadas) — sem André/Andressa que já existem como reais
const PAIRS: { p1: { name: string; email: string; gender: "MALE" | "FEMALE" }; p2: { name: string; email: string; gender: "MALE" | "FEMALE" } }[] = [
  { p1: { name: "Camila Tonelli", email: "camila.tonelli@real.btg", gender: "FEMALE" }, p2: { name: "Luís Oliveira",   email: "luis.oliveira@real.btg",  gender: "MALE"   } },
  { p1: { name: "Tallita",        email: "tallita@real.btg",         gender: "FEMALE" }, p2: { name: "Edu",            email: "edu@real.btg",             gender: "MALE"   } },
  { p1: { name: "Camilo",         email: "camilo@real.btg",          gender: "MALE"   }, p2: { name: "Ana",            email: "ana@real.btg",             gender: "FEMALE" } },
  { p1: { name: "Marlene",        email: "marlene@real.btg",         gender: "FEMALE" }, p2: { name: "Luís Ferreira",  email: "luis.ferreira@real.btg",  gender: "MALE"   } },
  { p1: { name: "Juliana Costa",  email: "juliana.costa@real.btg",   gender: "FEMALE" }, p2: { name: "Hugo",           email: "hugo@real.btg",            gender: "MALE"   } },
  { p1: { name: "Clara",          email: "clara@real.btg",           gender: "FEMALE" }, p2: { name: "Miguel",         email: "miguel@real.btg",          gender: "MALE"   } },
  { p1: { name: "Bianca",         email: "bianca@real.btg",          gender: "FEMALE" }, p2: { name: "Mauro",          email: "mauro@real.btg",           gender: "MALE"   } },
  { p1: { name: "Maria Moreira",  email: "maria.moreira@real.btg",   gender: "FEMALE" }, p2: { name: "Pedro Sá",       email: "pedro.sa@real.btg",        gender: "MALE"   } },
];

// Inscrições individuais
const INDIVIDUALS: { name: string; email: string; gender: "MALE" | "FEMALE" }[] = [
  { name: "Tiago Canoa", email: "tiago.canoa@real.btg",  gender: "MALE"   },
  { name: "Nicholas",    email: "nicholas@real.btg",     gender: "MALE"   },
  { name: "Filipe",      email: "filipe@real.btg",       gender: "MALE"   },
  { name: "Katia",       email: "katia@real.btg",        gender: "FEMALE" },
  { name: "Maíra Cruz",  email: "maira.cruz@real.btg",   gender: "FEMALE" },
  { name: "Juliana",     email: "juliana@real.btg",      gender: "FEMALE" }, // amiga Andressa
];

async function upsertMember(p: { name: string; email: string; gender: "MALE" | "FEMALE" }) {
  return db.member.upsert({
    where: { email: p.email },
    create: {
      clerkId: `fake_${p.email}`,
      name: p.name,
      email: p.email,
      gender: p.gender,
      level: "INTERMEDIATE",
      profileComplete: true,
    },
    update: { gender: p.gender, name: p.name },
  });
}

async function main() {
  // 1. Limpar matches e inscrições existentes no torneio
  const deletedMatches = await db.match.deleteMany({ where: { tournamentId: TOURNAMENT_ID } });
  console.log("Matches apagados:", deletedMatches.count);

  const deletedRegs = await db.registration.deleteMany({ where: { tournamentId: TOURNAMENT_ID } });
  console.log("Inscrições apagadas:", deletedRegs.count);

  // 2. Apagar todos os membros fake (de seeds anteriores)
  const fakes = await db.member.findMany({ where: { clerkId: { startsWith: "fake_" } }, select: { id: true } });
  if (fakes.length > 0) {
    const ids = fakes.map(m => m.id);
    await db.registration.deleteMany({ where: { player1Id: { in: ids } } });
    await db.registration.deleteMany({ where: { player2Id: { in: ids } } });
    const del = await db.member.deleteMany({ where: { clerkId: { startsWith: "fake_" } } });
    console.log("Membros fake apagados:", del.count);
  }

  // 3. Encontrar André e Andressa (membros reais)
  const realMembers = await db.member.findMany({
    where: { clerkId: { not: { startsWith: "fake_" } } },
    select: { id: true, name: true, gender: true },
  });
  const andre = realMembers.find(m => m.name.toLowerCase().includes("andre") && !m.name.toLowerCase().includes("andressa"))!;
  const andressa = realMembers.find(m => m.name.toLowerCase().includes("andressa"))!;
  if (!andre || !andressa) throw new Error("André ou Andressa não encontrados!");
  console.log("Reais encontrados:", andre.name, "/", andressa.name);

  // 4. Inscrever André/Andressa como dupla
  await db.registration.create({
    data: { tournamentId: TOURNAMENT_ID, player1Id: andre.id, player2Id: andressa.id, status: "CONFIRMED" },
  });
  console.log("Dupla inscrita: André / Andressa");

  // 5. Criar e inscrever as restantes duplas pré-formadas
  for (const pair of PAIRS) {
    const m1 = await upsertMember(pair.p1);
    const m2 = await upsertMember(pair.p2);
    await db.registration.create({
      data: { tournamentId: TOURNAMENT_ID, player1Id: m1.id, player2Id: m2.id, status: "CONFIRMED" },
    });
    console.log(`Dupla inscrita: ${pair.p1.name} / ${pair.p2.name}`);
  }

  // 6. Criar e inscrever os individuais
  for (const ind of INDIVIDUALS) {
    const m = await upsertMember(ind);
    await db.registration.create({
      data: { tournamentId: TOURNAMENT_ID, player1Id: m.id, status: "CONFIRMED" },
    });
    console.log(`Individual inscrito: ${ind.name} (${ind.gender === "MALE" ? "M" : "F"})`);
  }

  // 7. Verificação final
  const allRegs = await db.registration.findMany({
    where: { tournamentId: TOURNAMENT_ID, status: "CONFIRMED" },
    include: { player1: { select: { name: true, gender: true } }, player2: { select: { name: true, gender: true } } },
  });
  const pairs = allRegs.filter(r => r.player2Id !== null);
  const solos = allRegs.filter(r => r.player2Id === null);

  console.log("\n=== RESUMO ===");
  console.log(`Duplas pré-formadas: ${pairs.length} (${pairs.length * 2} pessoas)`);
  console.log(`Individuais: ${solos.length} (${solos.length} pessoas)`);
  console.log(`Total pessoas: ${pairs.length * 2 + solos.length}`);

  const allPlayers = [
    ...pairs.flatMap(r => [r.player1, r.player2!]),
    ...solos.map(r => r.player1),
  ];
  const males = allPlayers.filter(p => p.gender === "MALE").length;
  const females = allPlayers.filter(p => p.gender === "FEMALE").length;
  console.log(`Homens: ${males} | Mulheres: ${females}`);
}

main().then(() => db.$disconnect()).catch(e => { console.error(e.message); process.exit(1); });
