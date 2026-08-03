-- AlterTable
-- Modulos ativos do ministerio. Array vazio nos registros existentes; a
-- aplicacao le "vazio" como "todos os modulos habilitados", entao nenhum
-- ministerio ja cadastrado perde aba.
ALTER TABLE "Department" ADD COLUMN     "modules" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
-- Permissao por membro pra gerenciar musicas do ministerio. Zerada nos
-- registros existentes: lider, pastor e admin seguem liberados pelo papel.
ALTER TABLE "UserDepartmentMembership" ADD COLUMN     "canManageSongs" BOOLEAN NOT NULL DEFAULT false;
