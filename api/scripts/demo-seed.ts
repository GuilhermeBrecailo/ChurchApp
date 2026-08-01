/**
 * Cria o ambiente demo completo: igreja, pastor, usuário demo, membros, músicas e escalas.
 * Uso: npm run demo:seed
 */
import { $prismaClient } from "../config/database.ts";
import { KeycloakProvider } from "../src/infrastructure/identity/KeycloakProvider.ts";
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

async function seed() {
  const existing = await $prismaClient.crunch.findFirst({
    where: { isDemoChurch: true },
  });

  if (existing) {
    console.log("⚠️  Ambiente demo já existe. Rode npm run demo:reset para recriar os dados.");
    process.exit(0);
  }

  console.log("🌱 Criando ambiente demo...");

  // 1. Igreja demo
  const demoCrunch = await $prismaClient.crunch.create({
    data: {
      id: crypto.randomUUID(),
      name: "Igreja Demo",
      isDemoChurch: true,
      city: "São Paulo",
      road: "Rua Demo",
      localZipCode: "00000-000",
      state: "SP",
      complement: null,
      number: "1",
    },
  });

  // 2. Pastor Demo (no Keycloak + banco)
  const identityProvider = new KeycloakProvider();
  let pastorId = crypto.randomUUID();

  try {
    pastorId = await identityProvider.createUser(
      DEMO_PASTOR_EMAIL,
      "Pastor Demo",
      "demo1234",
      false,
    );
    console.log("✅ Pastor Demo criado no Keycloak");
  } catch {
    console.warn("⚠️  Keycloak indisponível. Pastor criado apenas no banco.");
  }

  const pastorDemo = await $prismaClient.user.create({
    data: {
      id: pastorId,
      name: "Pastor Demo",
      email: DEMO_PASTOR_EMAIL,
      role: "PASTOR",
      crunchId: demoCrunch.id,
      isDemoUser: false,
    },
  });

  // Vincular pastor como titular da igreja
  await $prismaClient.crunch.update({
    where: { id: demoCrunch.id },
    data: { userMainId: pastorDemo.id },
  });

  // 3. Cargos "Visitante" e "Líder de Ministério"
  const { visitanteRole, liderRole } = await ensureDemoChurchRoles(demoCrunch.id);

  // 4. Usuário Demo (no Keycloak + banco)
  let demoUserId = crypto.randomUUID();

  try {
    demoUserId = await identityProvider.createUser(
      DEMO_EMAIL,
      "Usuário Demo",
      DEMO_PASSWORD,
      false,
    );
    console.log("✅ Usuário Demo criado no Keycloak");
  } catch {
    console.warn("⚠️  Keycloak indisponível. Usuário demo criado apenas no banco.");
  }

  const demoUser = await $prismaClient.user.create({
    data: {
      id: demoUserId,
      name: "Usuário Demo",
      email: DEMO_EMAIL,
      role: "MEMBER",
      crunchId: demoCrunch.id,
      isDemoUser: true,
      churchRoleId: visitanteRole.id,
    },
  });

  // 4b. Líder Demo - ministro com permissões reais sobre o Louvor
  const minister = await ensureDemoMinister(demoCrunch.id, liderRole.id);

  // 5. Membros fictícios
  const members = await createDemoMembers(demoCrunch.id);

  // 6. Departamentos (Louvor liderado pelo Líder Demo, os demais pelo Pastor)
  const departments = await createDemoDepartments(
    demoCrunch.id,
    pastorDemo.id,
    minister.id,
  );
  const { louvor } = departments;

  await createDemoMinisterMembership(minister.id, louvor.id);

  // 7. Músicas
  const songItems = await createDemoSongs(louvor.id);
  const songIds = songItems.map((s) => s.id);

  // 8. Recursos, tarefas e escalas
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

  // 9. Conteúdo, pedidos e estado do usuário
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
✅ Demo criado com sucesso!
   Pastor:  ${DEMO_PASTOR_EMAIL} / ${DEMO_PASSWORD}
   Líder:   ${DEMO_MINISTER_EMAIL} / ${DEMO_PASSWORD}
   Membro:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}

   Igreja: ${demoCrunch.name} (ID: ${demoCrunch.id})
   Membros fictícios: ${members.length}
   Ministérios: 4 (Louvor, Jovens, Diaconato, Mídia)
   Músicas: ${songItems.length}
   Escalas: 6
   Devocionais: 1
   Versículos: 3
   Avisos: 2
   Pedidos de oração: 3

ℹ️  Para reset diário, adicione ao crontab (crontab -e):
   0 0 * * * cd ${process.cwd()} && npm run demo:reset >> /tmp/demo-reset.log 2>&1
`);

  await $prismaClient.$disconnect();
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Erro ao criar demo:", e);
  process.exit(1);
});
