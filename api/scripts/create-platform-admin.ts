/**
 * Cria um usuário Admin da plataforma (role ADMIN), sem vínculo com igreja —
 * acesso global ao painel administrativo (/admin, listagem de igrejas).
 * Cria tanto no Keycloak quanto no Postgres, com o mesmo id (mesmo padrão de demo-seed.ts).
 * Uso: npx tsx --env-file=.env scripts/create-platform-admin.ts
 */
import { $prismaClient } from "../config/database.ts";
import { KeycloakProvider } from "../src/infrastructure/identity/KeycloakProvider.ts";

const ADMIN_EMAIL = "admin@appquadrangular.com";
const ADMIN_PASSWORD = "admin1234";
const ADMIN_NAME = "Admin Plataforma";

async function main() {
  const existing = await $prismaClient.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    if (existing.role !== "ADMIN") {
      await $prismaClient.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN" },
      });
      console.log("✅ Usuário já existia — role atualizada para ADMIN.");
    } else {
      console.log("⚠️  Admin já existe.");
    }
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD} (se já existia, é a senha original)`);
    process.exit(0);
  }

  const identityProvider = new KeycloakProvider();
  let adminId = crypto.randomUUID();

  try {
    adminId = await identityProvider.createUser(
      ADMIN_EMAIL,
      ADMIN_NAME,
      ADMIN_PASSWORD,
      false,
    );
    console.log("✅ Admin criado no Keycloak");
  } catch (err) {
    console.warn("⚠️  Falha ao criar no Keycloak, criando só no banco:", err);
  }

  await $prismaClient.user.create({
    data: {
      id: adminId,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: "ADMIN",
      isDemoUser: false,
    },
  });

  console.log("✅ Admin da plataforma criado com sucesso!");
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Senha: ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Falha ao criar admin:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
