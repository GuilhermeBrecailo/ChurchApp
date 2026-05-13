-- CreateTable
CREATE TABLE "tenant_auths" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "tenant_auths_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_auths_group_id_key" ON "tenant_auths"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_auths_scope_id_key" ON "tenant_auths"("scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_auths_client_id_key" ON "tenant_auths"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_auths_user_id_key" ON "tenant_auths"("user_id");

-- AddForeignKey
ALTER TABLE "tenant_auths" ADD CONSTRAINT "tenant_auths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
