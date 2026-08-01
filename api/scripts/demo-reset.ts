/**
 * Reseta os dados da igreja demo para o estado inicial.
 * Preserva os usuários demo (não recria no Keycloak).
 * Uso: npm run demo:reset
 */
import { $prismaClient } from "../config/database.ts";
import {
  DEMO_EMAIL,
  DEMO_PASTOR_EMAIL,
  DEMO_MINISTER_EMAIL,
  DEMO_PASSWORD,
  createDemoDepartments,
  createDemoSongs,
  createDemoSchedules,
  createDemoOtherSchedules,
  createDemoMembers,
  createDemoDepartmentResources,
  createDemoTasks,
  createDemoContent,
  createDemoUserState,
  ensureDemoChurchRoles,
  ensureDemoMinister,
  createDemoMinisterMembership,
} from "./demo-data.ts";

async function reset() {
  console.log("🔄 Iniciando reset do ambiente demo...");

  const demoCrunch = await $prismaClient.crunch.findFirst({
    where: { isDemoChurch: true },
    include: { users: { select: { id: true, email: true } } },
  });

  if (!demoCrunch) {
    console.log("⚠️  Nenhum ambiente demo encontrado. Rode npm run demo:seed primeiro.");
    process.exit(0);
  }

  // 1. Deletar conteúdo e estado do usuário demo
  await $prismaClient.prayerRequest.deleteMany({
    where: { crunchId: demoCrunch.id },
  });

  await $prismaClient.devotional.deleteMany({
    where: { crunchId: demoCrunch.id },
  });

  await $prismaClient.announcement.deleteMany({
    where: { crunchId: demoCrunch.id },
  });

  await $prismaClient.dailyVerse.deleteMany({
    where: { crunchId: demoCrunch.id },
  });

  await $prismaClient.appNotification.deleteMany({
    where: { user: { crunchId: demoCrunch.id } },
  });

  await $prismaClient.userUnavailableDate.deleteMany({
    where: { user: { crunchId: demoCrunch.id } },
  });

  await $prismaClient.userSongPreference.deleteMany({
    where: { user: { crunchId: demoCrunch.id } },
  });

  // 2. Deletar escalas (cascade deleta assignments e schedule media items)
  await $prismaClient.schedule.deleteMany({
    where: { department: { crunchId: demoCrunch.id } },
  });

  // 3. Deletar tarefas, vínculos, músicas e recursos
  await $prismaClient.departmentTask.deleteMany({
    where: { department: { crunchId: demoCrunch.id } },
  });

  await $prismaClient.userDepartmentMembership.deleteMany({
    where: { department: { crunchId: demoCrunch.id } },
  });

  await $prismaClient.mediaItem.deleteMany({
    where: { department: { crunchId: demoCrunch.id } },
  });

  // 4. Deletar departamentos
  await $prismaClient.department.deleteMany({
    where: { crunchId: demoCrunch.id },
  });

  // 5. Deletar membros fictícios (preserva usuário demo, pastor demo e líder demo)
  await $prismaClient.user.deleteMany({
    where: {
      crunchId: demoCrunch.id,
      email: { notIn: [DEMO_EMAIL, DEMO_PASTOR_EMAIL, DEMO_MINISTER_EMAIL] },
    },
  });

  console.log("🧹 Dados limpos. Recriando...");

  // Buscar pastor e usuário demo
  const pastorDemo = await $prismaClient.user.findFirst({
    where: { email: DEMO_PASTOR_EMAIL },
  });

  const demoUser = await $prismaClient.user.findFirst({
    where: { email: DEMO_EMAIL },
  });

  if (!pastorDemo || !demoUser) {
    console.error("❌ Usuários demo não encontrados. Execute npm run demo:seed.");
    process.exit(1);
  }

  // Garantir cargos e o Líder Demo (ministro com permissões sobre o Louvor)
  const { liderRole } = await ensureDemoChurchRoles(demoCrunch.id);
  const minister = await ensureDemoMinister(demoCrunch.id, liderRole.id);

  // Recriar dados
  const members = await createDemoMembers(demoCrunch.id);
  const departments = await createDemoDepartments(
    demoCrunch.id,
    pastorDemo.id,
    minister.id,
  );
  const { louvor } = departments;

  await createDemoMinisterMembership(minister.id, louvor.id);

  const songItems = await createDemoSongs(louvor.id);
  const songIds = songItems.map((s) => s.id);

  await createDemoDepartmentResources(departments);
  await createDemoTasks(departments, [
    demoUser.id,
    ...members.map((m) => m.id),
  ]);

  await createDemoSchedules(
    louvor.id,
    demoUser.id,
    members.map((m) => m.id),
    songIds,
  );

  await createDemoOtherSchedules(
    {
      jovens: departments.jovens,
      diaconato: departments.diaconato,
      midia: departments.midia,
    },
    members.map((m) => m.id),
  );

  await createDemoContent(demoCrunch.id, pastorDemo.id, [
    demoUser.id,
    ...members.map((m) => m.id),
  ]);
  await createDemoUserState(
    demoUser.id,
    members.map((m) => m.id),
    songIds,
    [louvor.id, departments.diaconato.id, departments.midia.id],
  );

  console.log(`
✅ Reset completo! [${new Date().toISOString()}]
   Pastor:  ${DEMO_PASTOR_EMAIL} / ${DEMO_PASSWORD}
   Líder:   ${DEMO_MINISTER_EMAIL} / ${DEMO_PASSWORD}
   Membro:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}
`);

  await $prismaClient.$disconnect();
  process.exit(0);
}

reset().catch((e) => {
  console.error("❌ Erro no reset:", e);
  process.exit(1);
});
