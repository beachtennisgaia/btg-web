import "dotenv/config";
import { db } from "../src/lib/db";

const FAKE_PLAYERS = [
  // Masculino
  { name: "João Silva",      email: "joao.silva.test@btg.fake",      level: "ADVANCED" as const,      gender: "MALE" as const },
  { name: "Pedro Santos",    email: "pedro.santos.test@btg.fake",    level: "INTERMEDIATE" as const,  gender: "MALE" as const },
  { name: "Miguel Costa",    email: "miguel.costa.test@btg.fake",    level: "BEGINNER" as const,      gender: "MALE" as const },
  { name: "Tiago Ferreira",  email: "tiago.ferreira.test@btg.fake",  level: "ADVANCED" as const,      gender: "MALE" as const },
  { name: "Bruno Oliveira",  email: "bruno.oliveira.test@btg.fake",  level: "INTERMEDIATE" as const,  gender: "MALE" as const },
  { name: "Ricardo Pereira", email: "ricardo.pereira.test@btg.fake", level: "BEGINNER" as const,      gender: "MALE" as const },
  { name: "Carlos Mendes",   email: "carlos.mendes.test@btg.fake",   level: "INTERMEDIATE" as const,  gender: "MALE" as const },
  { name: "André Rodrigues", email: "andre.rodrigues.test@btg.fake", level: "ADVANCED" as const,      gender: "MALE" as const },
  { name: "Rui Gomes",       email: "rui.gomes.test@btg.fake",       level: "BEGINNER" as const,      gender: "MALE" as const },
  { name: "Filipe Martins",  email: "filipe.martins.test@btg.fake",  level: "INTERMEDIATE" as const,  gender: "MALE" as const },
  { name: "Nuno Carvalho",   email: "nuno.carvalho.test@btg.fake",   level: "ADVANCED" as const,      gender: "MALE" as const },
  { name: "Luís Teixeira",   email: "luis.teixeira.test@btg.fake",   level: "BEGINNER" as const,      gender: "MALE" as const },
  // Feminino
  { name: "Ana Ferreira",    email: "ana.ferreira.test@btg.fake",    level: "ADVANCED" as const,      gender: "FEMALE" as const },
  { name: "Sofia Costa",     email: "sofia.costa.test@btg.fake",     level: "INTERMEDIATE" as const,  gender: "FEMALE" as const },
  { name: "Marta Silva",     email: "marta.silva.test@btg.fake",     level: "BEGINNER" as const,      gender: "FEMALE" as const },
  { name: "Inês Santos",     email: "ines.santos.test@btg.fake",     level: "ADVANCED" as const,      gender: "FEMALE" as const },
  { name: "Catarina Lopes",  email: "catarina.lopes.test@btg.fake",  level: "INTERMEDIATE" as const,  gender: "FEMALE" as const },
  { name: "Beatriz Mendes",  email: "beatriz.mendes.test@btg.fake",  level: "BEGINNER" as const,      gender: "FEMALE" as const },
  { name: "Joana Oliveira",  email: "joana.oliveira.test@btg.fake",  level: "INTERMEDIATE" as const,  gender: "FEMALE" as const },
  { name: "Rita Pereira",    email: "rita.pereira.test@btg.fake",    level: "ADVANCED" as const,      gender: "FEMALE" as const },
  { name: "Mariana Gomes",   email: "mariana.gomes.test@btg.fake",   level: "BEGINNER" as const,      gender: "FEMALE" as const },
  { name: "Diana Martins",   email: "diana.martins.test@btg.fake",   level: "INTERMEDIATE" as const,  gender: "FEMALE" as const },
  { name: "Patrícia Cunha",  email: "patricia.cunha.test@btg.fake",  level: "ADVANCED" as const,      gender: "FEMALE" as const },
  { name: "Vera Rodrigues",  email: "vera.rodrigues.test@btg.fake",  level: "BEGINNER" as const,      gender: "FEMALE" as const },
];

async function main() {
  // Show tournaments first
  const tournaments = await db.tournament.findMany({
    select: { id: true, name: true, status: true, registrationType: true, maxPairs: true },
  });
  console.log("Torneios disponíveis:");
  tournaments.forEach((t) => console.log(`  [${t.status}] ${t.name} — id: ${t.id}`));

  // Use first ONGOING or OPEN tournament
  const target = tournaments.find((t) => t.status === "ONGOING") ?? tournaments.find((t) => t.status === "OPEN");
  if (!target) { console.log("Nenhum torneio ONGOING ou OPEN encontrado."); return; }

  console.log(`\nA criar dados de teste para: ${target.name}`);

  // Create fake members
  const members = await Promise.all(
    FAKE_PLAYERS.map((p, i) =>
      db.member.upsert({
        where: { email: p.email },
        update: { gender: p.gender, level: p.level },
        create: {
          clerkId: `fake_${p.email}`,
          name: p.name,
          email: p.email,
          level: p.level,
          gender: p.gender,
          profileComplete: true,
        },
      })
    )
  );
  console.log(`✓ ${members.length} sócios de teste criados`);

  // Create registrations (pairs: 0+1, 2+3, 4+5, 6+7)
  const isPairs = target.registrationType === "PAIRS";
  const regs = [];
  if (isPairs) {
    for (let i = 0; i < members.length; i += 2) {
      try {
        const reg = await db.registration.upsert({
          where: { tournamentId_player1Id: { tournamentId: target.id, player1Id: members[i].id } },
          update: { status: "CONFIRMED" },
          create: {
            tournamentId: target.id,
            player1Id: members[i].id,
            player2Id: members[i + 1]?.id ?? null,
            status: "CONFIRMED",
          },
        });
        regs.push(reg);
      } catch (e) {
        console.error(`Erro na inscrição ${i}:`, (e as Error).message);
      }
    }
  } else {
    for (const member of members) {
      try {
        const reg = await db.registration.upsert({
          where: { tournamentId_player1Id: { tournamentId: target.id, player1Id: member.id } },
          update: { status: "CONFIRMED" },
          create: { tournamentId: target.id, player1Id: member.id, status: "CONFIRMED" },
        });
        regs.push(reg);
      } catch (e) {
        console.error(`Erro na inscrição ${member.name}:`, (e as Error).message);
      }
    }
  }

  console.log(`✓ ${regs.length} inscrições confirmadas`);
  console.log(`\nTorneio pronto para testar: ${target.id}`);
}

main().catch(console.error).finally(() => process.exit(0));
