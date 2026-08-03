-- Cargos com alcance (igreja/ministerio), permissoes granulares, multi-cargo
-- por pessoa e fim das flags por membro. O data-fix roda ANTES dos drops para
-- nao perder o acesso que ja existia.

-- 1. Estrutura nova ------------------------------------------------------------

ALTER TABLE "ChurchRole" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'CHURCH';
ALTER TABLE "ChurchRole" ADD COLUMN "departmentId" TEXT;

CREATE TABLE "MembershipRole" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "membershipId" TEXT NOT NULL,
    "churchRoleId" TEXT NOT NULL,
    CONSTRAINT "MembershipRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipRole_membershipId_churchRoleId_key" ON "MembershipRole"("membershipId", "churchRoleId");
CREATE INDEX "MembershipRole_membershipId_idx" ON "MembershipRole"("membershipId");
CREATE INDEX "MembershipRole_churchRoleId_idx" ON "MembershipRole"("churchRoleId");
CREATE INDEX "ChurchRole_crunchId_idx" ON "ChurchRole"("crunchId");
CREATE INDEX "ChurchRole_departmentId_idx" ON "ChurchRole"("departmentId");

ALTER TABLE "ChurchRole" ADD CONSTRAINT "ChurchRole_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembershipRole" ADD CONSTRAINT "MembershipRole_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "ChurchMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembershipRole" ADD CONSTRAINT "MembershipRole_churchRoleId_fkey" FOREIGN KEY ("churchRoleId") REFERENCES "ChurchRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Data-fix (antes de dropar as colunas antigas) -----------------------------

DO $$
DECLARE
    r RECORD;
    v_role_id TEXT;
    v_membership_id TEXT;
BEGIN
    -- 2a. Reescreve as permissoes dos cargos existentes (todos viram scope=CHURCH).
    --     MANAGE_MEMBERS  -> MEMBER_CREATE/EDIT/DELETE
    --     PUBLISH_CONTENT -> CONTENT_PUBLISH + ANNOUNCEMENT_PUBLISH
    --     Permissoes de ministerio (MANAGE_SONGS/SCHEDULES/DEPARTMENTS,
    --     SEND_NOTIFICATIONS) nao tem equivalente em cargo de igreja: sao
    --     descartadas e logadas para o pastor revisar.
    FOR r IN SELECT "id", "permissions", "name" FROM "ChurchRole" LOOP
        DECLARE
            new_perms TEXT[] := ARRAY[]::TEXT[];
            p TEXT;
        BEGIN
            FOREACH p IN ARRAY r."permissions" LOOP
                IF p = 'MANAGE_MEMBERS' THEN
                    new_perms := new_perms || ARRAY['MEMBER_CREATE', 'MEMBER_EDIT', 'MEMBER_DELETE'];
                ELSIF p = 'PUBLISH_CONTENT' THEN
                    new_perms := new_perms || ARRAY['CONTENT_PUBLISH', 'ANNOUNCEMENT_PUBLISH'];
                ELSE
                    RAISE NOTICE 'ChurchRole % (%): permissao "%" sem equivalente de igreja, descartada (revisar manualmente)', r."name", r."id", p;
                END IF;
            END LOOP;
            SELECT ARRAY(SELECT DISTINCT unnest(new_perms)) INTO new_perms;
            UPDATE "ChurchRole" SET "permissions" = new_perms WHERE "id" = r."id";
        END;
    END LOOP;

    -- 2b. Migra o vinculo unico atual (ChurchMembership.churchRoleId) para a
    --     tabela de ligacao MembershipRole.
    INSERT INTO "MembershipRole" ("id", "membershipId", "churchRoleId")
    SELECT gen_random_uuid(), cm."id", cm."churchRoleId"
    FROM "ChurchMembership" cm
    WHERE cm."churchRoleId" IS NOT NULL
    ON CONFLICT ("membershipId", "churchRoleId") DO NOTHING;

    -- 2c. Cada flag por membro (canManageSongs/canManageSchedule) vira um cargo
    --     de ministerio equivalente (get-or-create) atribuido a membership da
    --     igreja correspondente.
    FOR r IN
        SELECT udm."userId",
               udm."canManageSongs" AS can_songs,
               udm."canManageSchedule" AS can_schedule,
               d."id" AS dept_id,
               d."crunchId" AS crunch_id
        FROM "UserDepartmentMembership" udm
        JOIN "Department" d ON d."id" = udm."departmentId"
        WHERE udm."canManageSongs" = true OR udm."canManageSchedule" = true
    LOOP
        SELECT cm."id" INTO v_membership_id
        FROM "ChurchMembership" cm
        WHERE cm."userId" = r."userId" AND cm."crunchId" = r.crunch_id
        LIMIT 1;

        IF v_membership_id IS NULL THEN
            RAISE NOTICE 'Usuario % sem membership na igreja % - flag do ministerio % nao migrada', r."userId", r.crunch_id, r.dept_id;
            CONTINUE;
        END IF;

        IF r.can_songs THEN
            v_role_id := NULL;
            SELECT "id" INTO v_role_id FROM "ChurchRole"
            WHERE "crunchId" = r.crunch_id AND "departmentId" = r.dept_id
              AND "scope" = 'MINISTRY' AND "name" = 'Repertório (migração)'
            LIMIT 1;
            IF v_role_id IS NULL THEN
                v_role_id := gen_random_uuid();
                INSERT INTO "ChurchRole" ("id", "name", "description", "permissions", "scope", "crunchId", "departmentId")
                VALUES (v_role_id, 'Repertório (migração)', 'Cargo criado na migração para preservar acesso ao repertório', ARRAY['SONG_CREATE', 'SONG_EDIT', 'SONG_DELETE'], 'MINISTRY', r.crunch_id, r.dept_id);
            END IF;
            INSERT INTO "MembershipRole" ("id", "membershipId", "churchRoleId")
            VALUES (gen_random_uuid(), v_membership_id, v_role_id)
            ON CONFLICT ("membershipId", "churchRoleId") DO NOTHING;
        END IF;

        IF r.can_schedule THEN
            v_role_id := NULL;
            SELECT "id" INTO v_role_id FROM "ChurchRole"
            WHERE "crunchId" = r.crunch_id AND "departmentId" = r.dept_id
              AND "scope" = 'MINISTRY' AND "name" = 'Escala (migração)'
            LIMIT 1;
            IF v_role_id IS NULL THEN
                v_role_id := gen_random_uuid();
                INSERT INTO "ChurchRole" ("id", "name", "description", "permissions", "scope", "crunchId", "departmentId")
                VALUES (v_role_id, 'Escala (migração)', 'Cargo criado na migração para preservar acesso à escala', ARRAY['SCHEDULE_CREATE', 'SCHEDULE_EDIT', 'SCHEDULE_DELETE'], 'MINISTRY', r.crunch_id, r.dept_id);
            END IF;
            INSERT INTO "MembershipRole" ("id", "membershipId", "churchRoleId")
            VALUES (gen_random_uuid(), v_membership_id, v_role_id)
            ON CONFLICT ("membershipId", "churchRoleId") DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- 3. Remove as colunas antigas (FKs sao removidas junto com as colunas) --------

ALTER TABLE "User" DROP COLUMN "churchRoleId";
ALTER TABLE "ChurchMembership" DROP COLUMN "churchRoleId";
ALTER TABLE "UserDepartmentMembership" DROP COLUMN "canManageSongs";
ALTER TABLE "UserDepartmentMembership" DROP COLUMN "canManageSchedule";
