-- DropIndex
DROP INDEX "todos_status_idx";

-- DropIndex
DROP INDEX "todos_userId_status_idx";

-- CreateIndex
CREATE INDEX "todos_userId_status_createdAt_idx" ON "todos"("userId", "status", "createdAt");
