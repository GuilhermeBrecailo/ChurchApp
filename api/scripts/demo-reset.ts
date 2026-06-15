/**
 * Reseta os dados da igreja demo para o estado inicial.
 * Preserva os usuários demo (não recria no Keycloak).
 * Uso: npm run demo:reset
 */
import { $prismaClient } from "../config/database.ts";
import {
  DEMO_EMAIL,
  DEMO_PASTOR_EMAIL,
  createDemoDepartments,
  createDemoSongs,
  createDemoSchedules,
  createDemoMembers,
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

  // 1. Deletar escalas (cascade deleta assignments e schedule media items)
  await $prismaClient.schedule.deleteMany({
    where: { department: { crunchId: demoCrunch.id } },
  });

  // 2. Deletar músicas e recursos
  await $prismaClient.mediaItem.deleteMany({
    where: { department: { crunchId: demoCrunch.id } },
  });

  // 3. Deletar departamentos
  await $prismaClient.department.deleteMany({
    where: { crunchId: demoCrunch.id },
  });

  // 4. Deletar membros fictícios (preserva usuário demo e pastor demo)
  await $prismaClient.user.deleteMany({
    where: {
      crunchId: demoCrunch.id,
      email: { notIn: [DEMO_EMAIL, DEMO_PASTOR_EMAIL] },
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

  // Recriar dados
  const members = await createDemoMembers(demoCrunch.id);
  const { louvor } = await createDemoDepartments(demoCrunch.id, pastorDemo.id);
  const songItems = await createDemoSongs(louvor.id);
  const songIds = songItems.map((s) => s.id);

  await createDemoSchedules(
    louvor.id,
    demoUser.id,
    members.map((m) => m.id),
    songIds,
  );

  console.log(`✅ Reset completo! [${new Date().toISOString()}]`);

  await $prismaClient.$disconnect();
  process.exit(0);
}

reset().catch((e) => {
  console.error("❌ Erro no reset:", e);
  process.exit(1);
});
